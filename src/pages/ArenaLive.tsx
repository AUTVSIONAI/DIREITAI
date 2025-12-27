import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { arenaService, Arena, ArenaQuestion } from '../services/arena';
import Header from '../components/user/Header';
import Sidebar from '../components/user/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Video, Mic, MicOff, VideoOff, Play, Square, Settings, Users, UserPlus, Check, X, Search, ThumbsUp, Share2, Eye, BarChart2, Hand, Trash2, RefreshCw, ArrowLeft } from 'lucide-react';
import { apiClient as api } from '../lib/api';

// Internal component for stable video rendering (Local & Remote)
const StreamVideoPlayer = React.memo(({ 
    stream, 
    className, 
    muted = false, 
    mirror = false 
}: { 
    stream: MediaStream | null, 
    className: string,
    muted?: boolean,
    mirror?: boolean
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => {
                // Ignore AbortError which happens when pausing/playing rapidly
                if (e.name !== 'AbortError') console.error("Error playing video:", e);
            });
        } else if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    }, [stream]);

    return (
        <video 
            ref={videoRef}
            className={`${className} ${mirror ? 'transform scale-x-[-1]' : ''}`}
            autoPlay
            playsInline
            muted={muted}
        />
    );
});

// Center Stage Component (External definition for stability)
const CenterStage = React.memo(({ 
    spotlightId, 
    hostId, 
    userId, 
    localStream, 
    isStreamActive, 
    showGreenRoom, 
    remoteStreams, 
    participants, 
    arena, 
    getUserData,
    amIHost = false,
    isCamOn = true
}: {
    spotlightId: string | null;
    hostId: string | undefined;
    userId: string | undefined;
    localStream: MediaStream | null;
    isStreamActive: boolean;
    showGreenRoom: boolean;
    remoteStreams: Map<string, MediaStream>;
    participants: any[];
    arena: Arena | null;
    getUserData: (userObj: any) => any;
    amIHost?: boolean;
    isCamOn?: boolean;
}) => {
    // 1. Determine Target ID
    const targetId = spotlightId || hostId;
    
    // 2. Identify who the target is
    // If I am the host, and target is host, then I am target.
    // Also check standard ID match
    const isTargetHost = targetId === hostId;
    const isTargetSelf = (userId && targetId === userId) || (isTargetHost && amIHost);
    
    // 3. Determine Stream Availability
    let videoStream: MediaStream | null = null;
    let isLocal = false;

    if (isTargetSelf) {
        // If I am the target, use my local stream
        // Only use local stream if camera is ON
        if (localStream && isCamOn) {
            videoStream = localStream;
            isLocal = true;
        }
    } else {
        // Remote Target
        if (targetId && remoteStreams.has(targetId)) {
            videoStream = remoteStreams.get(targetId)!;
        } else if (isTargetHost && hostId && remoteStreams.has(hostId)) {
            // Fallback: If target is Host, grab Host stream explicitly
            videoStream = remoteStreams.get(hostId)!;
        }
    }

    // Effect to handle local stream attachment reliably
    // const localVideoRef = useRef<HTMLVideoElement>(null);
    // useEffect(() => {
    //     if (isLocal && videoStream && localVideoRef.current) {
    //         // Force reload srcObject
    //         localVideoRef.current.srcObject = videoStream;
    //         localVideoRef.current.play().catch(e => console.error("Error playing local video:", e));
    //     }
    // }, [isLocal, videoStream]);

    // 4. Render Video if available
    if (videoStream) {
        return (
            <StreamVideoPlayer 
                stream={videoStream}
                className="w-full h-full object-contain bg-black"
                muted={isLocal}
                mirror={isLocal}
            />
        );
    }

    // 5. Fallback: Render Avatar
    let avatarUrl = null;
    let name = 'Participante';

    if (isTargetHost && arena?.politicians) {
        avatarUrl = arena.politicians.photo_url;
        name = arena.politicians.name || 'Anfitrião';
    } else {
        const p = participants.find(p => p.user_id === targetId);
        if (p) {
            const pUser = getUserData(p.users);
            avatarUrl = pUser?.avatar_url;
            name = pUser?.full_name || 'Participante';
        } else if (isTargetHost) {
             name = 'Anfitrião';
        }
    }

    const avatarSrc = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256`;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 pointer-events-none">
             <div className="flex flex-col items-center animate-fadeIn">
                 <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-700 shadow-2xl mb-6 relative">
                     <img src={avatarSrc} className="w-full h-full object-cover" alt={name} />
                     {/* Status Indicator (Yellow for waiting, Red for error/live-but-no-video) */}
                     <div className="absolute bottom-4 right-4 w-6 h-6 bg-yellow-500 rounded-full border-2 border-gray-900 animate-pulse" title="Aguardando vídeo..."></div>
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
                 <p className="text-gray-400">
                     {localStream && isTargetSelf ? 'Carregando vídeo...' : (isTargetSelf ? 'Aguardando sua câmera...' : (arena?.status === 'live' ? 'Aguardando vídeo...' : 'Transmissão em breve'))}
                 </p>
             </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for React.memo
    // Always re-render if localStream changes reference or active state changes
    if (prevProps.localStream !== nextProps.localStream) return false;
    if (prevProps.isStreamActive !== nextProps.isStreamActive) return false;
    if (prevProps.spotlightId !== nextProps.spotlightId) return false;
    if (prevProps.remoteStreams !== nextProps.remoteStreams) return false;
    if (prevProps.remoteStreams.size !== nextProps.remoteStreams.size) return false;
    if (prevProps.amIHost !== nextProps.amIHost) return false;
    if (prevProps.isCamOn !== nextProps.isCamOn) return false;
    
    return true;
});

// Helper to safely get user data from Supabase join
const getUserData = (userObj: any) => {
  if (!userObj) return null;
  if (Array.isArray(userObj)) {
      return userObj.length > 0 ? userObj[0] : null;
  }
  return userObj;
};

const LiveTimer = ({ startDate }: { startDate: string | undefined }) => {
    const [elapsed, setElapsed] = useState('00:00:00');
    
    useEffect(() => {
        if (!startDate) return;
        const start = new Date(startDate).getTime();
        
        const updateTimer = () => {
            const now = Date.now();
            const diff = now - start;
            if (diff < 0) {
                setElapsed('00:00:00');
                return;
            }
            
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            
            setElapsed(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startDate]);
    
    return <span className="font-mono text-white/90 text-sm md:text-base font-bold ml-2 bg-black/40 px-2 py-0.5 rounded">{elapsed}</span>;
};

const ArenaLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();

  // Helper to find the priority stream (Spotlight -> Politician ID -> Any Politician)
  const getPriorityStream = () => {
      if (spotlightId && remoteStreams.has(spotlightId)) {
          return remoteStreams.get(spotlightId);
      }
      // Fallback to arena politician_id
      if (arena?.politician_id && remoteStreams.has(arena.politician_id)) {
          return remoteStreams.get(arena.politician_id);
      }
      // Fallback to any participant with role 'politician'
      const politicianParticipant = participants.find(p => p.role === 'politician');
      if (politicianParticipant && remoteStreams.has(politicianParticipant.user_id)) {
          return remoteStreams.get(politicianParticipant.user_id);
      }
      return null;
  };

  const [arena, setArena] = useState<Arena | null>(null);
  const [questions, setQuestions] = useState<ArenaQuestion[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invitation State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [inviteRole, setInviteRole] = useState('journalist');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteMode, setInviteMode] = useState<'search' | 'email'>('search');
  const [newUserCreds, setNewUserCreds] = useState<{email: string, password: string} | null>(null);

  // Stats State
  const [viewersCount, setViewersCount] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showStats, setShowStats] = useState(false); // For Anchor Dashboard
  const [showSummary, setShowSummary] = useState(false); // End of stream summary
  const [spotlightId, setSpotlightId] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'questions'>('questions');
  const [superChatAmount, setSuperChatAmount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WebRTC & Streaming State
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const signalingChannel = useRef<any>(null);

  // Stream State
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showGreenRoom, setShowGreenRoom] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null); // State to force re-renders and track stream availability
  const lastActionTime = useRef(0); // Track last user action to suppress polling

  // Sync state with ref to ensure UI updates - Fix for video getting stuck on "Aguardando vídeo..."
  useEffect(() => {
    if ((isStreamActive || showGreenRoom) && streamRef.current && !localStreamState) {
        setLocalStreamState(streamRef.current);
    }
  }, [isStreamActive, showGreenRoom, localStreamState]);

  // Derived Permissions
  const currentUserId = userProfile?.id || user?.id;
  const isPoliticianHost = userProfile?.role === 'politician' && (userProfile?.politician_id === arena?.politician_id || userProfile?.id === arena?.politician_id);
  const isAdmin = userProfile?.role === 'admin';
  
  // Check participation status first
  const myParticipant = participants.find(p => p.user_id === currentUserId);
  const isParticipant = participants.some(p => p.user_id === currentUserId && p.status === 'accepted');
  const pendingInvite = participants.find(p => p.user_id === currentUserId && p.status === 'invited');
  const isModerator = participants.some(p => p.user_id === currentUserId && (p.role === 'moderator' || p.role === 'journalist') && p.status === 'accepted');

  // "Host" capabilities for UI compatibility
  // Admin is ALWAYS host, even if participating as a guest
  const isHost = isPoliticianHost || isAdmin; 
  
  const canManage = isHost || isModerator || isAdmin;
  
  // Allow stream if host, moderator, accepted participant, OR if explicit permission granted
  const canStream = isHost || isParticipant || isModerator || myParticipant?.can_speak || myParticipant?.can_video;
  const canInvite = isHost || isModerator || isAdmin;

  // Permissions Logic
  useEffect(() => {
    // Kept empty for structure or future debugging
  }, [userProfile, participants, isHost, isParticipant, canStream, spotlightId, remoteStreams]);

  useEffect(() => {
    if (id) {
      loadArena(id);
      loadQuestions(id);
      loadChat(id);
      loadParticipants(id);
      loadStats(id);
      
      const interval = setInterval(() => {
        loadQuestions(id);
        loadChat(id);
        // Skip polling if recent action occurred (within 10 seconds) to avoid overwriting optimistic updates
        if (Date.now() - lastActionTime.current > 10000) {
            loadParticipants(id);
        } else {
            console.log('Skipping participant poll due to recent action');
        }
        loadStats(id);
        // Refresh arena status too
        arenaService.getArenaById(id).then(data => {
            if (data.status !== arena?.status) {
                setArena(prev => prev ? { ...prev, status: data.status } : data);
            }
        }).catch(console.error);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [id]);

  // WebRTC Signaling Logic
  useEffect(() => {
    if (!id || !userProfile || !arena) return;

    const channel = supabase.channel(`arena_signaling_${id}`);
    signalingChannel.current = channel;

    // Presence (Viewers Count)
    const presenceChannel = supabase.channel(`arena_presence_${id}`, {
        config: { presence: { key: userProfile.id } }
    });

    // Realtime Participants Updates (Permissions, Join/Leave)
    const participantsChannel = supabase.channel(`arena_participants_changes_${id}`)
        .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'arena_participants', 
            filter: `arena_id=eq.${id}` 
        }, (payload) => {
            console.log('Realtime update:', payload);
            
            if (payload.eventType === 'UPDATE') {
                const { new: newRecord, old: oldRecord } = payload;
                console.log(`Update for ${newRecord.user_id}. Hand changed? ${newRecord.hand_raised !== oldRecord.hand_raised}`);

                setParticipants(prev => prev.map(p => {
                    if (p.id === newRecord.id) {
                        // Intelligent Merge to prevent flickering
                        // If hand_raised didn't change in this DB update, but differs from local,
                        // it might be an optimistic update we want to preserve against a stale/unrelated event (e.g. heartbeat)
                        const handChangedInDb = newRecord.hand_raised !== oldRecord.hand_raised;
                        const localHandDiffer = p.hand_raised !== newRecord.hand_raised;

                        let resolvedHandRaised = newRecord.hand_raised;

                        if (!handChangedInDb && localHandDiffer) {
                            console.log(`[Realtime] Ignoring stale hand_raised (${newRecord.hand_raised}) for ${p.user_id} - preserving local (${p.hand_raised})`);
                            resolvedHandRaised = p.hand_raised;
                        }

                        return { ...p, ...newRecord, hand_raised: resolvedHandRaised };
                    }
                    return p;
                }));
            } else if (payload.eventType === 'DELETE') {
                // For deletes, we can remove directly
                setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
            } else {
                // For INSERT, we need to fetch user data, so we reload
                loadParticipants(id);
            }
        })
        .subscribe();

    presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            setViewersCount(Object.keys(state).length);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({
                    user_id: userProfile.id,
                    role: userProfile.role
                });
            }
        });

    const rtcConfig = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const createPeerConnection = (targetId: string, isInitiator: boolean) => {
        if (peerConnections.current.has(targetId)) return peerConnections.current.get(targetId);

        console.log(`Creating PC for ${targetId}, initiator: ${isInitiator}`);
        const pc = new RTCPeerConnection(rtcConfig);
        peerConnections.current.set(targetId, pc);

        // Add local tracks if streaming
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, streamRef.current!);
            });
        }

        pc.ontrack = (event) => {
            console.log(`Received track from ${targetId}`);
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetId, event.streams[0]);
                return newMap;
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: { target: targetId, sender: userProfile.id, candidate: event.candidate }
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${targetId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(targetId);
                    return newMap;
                });
                peerConnections.current.delete(targetId);
            }
        };

        return pc;
    };

    channel
      .on('broadcast', { event: 'permission-update' }, ({ payload }) => {
        if (payload.targetId === userProfile.id || payload.targetId === 'all') {
            console.log('Broadcast: Permission updated, reloading...');
            loadParticipants(id);
        }
      })
      .on('broadcast', { event: 'join-request' }, async ({ payload }) => {
        // A user joined and wants to connect
        // If I am streaming, I should offer my stream
        if (!isStreamActive || !streamRef.current) return;
        
        const { userId: requesterId } = payload;
        if (requesterId === userProfile.id) return;

        // FORCE RESET: If we already have a connection for this user, it's likely stale (they reloaded or toggled stream)
        // We must close it to accept the new handshake
        if (peerConnections.current.has(requesterId)) {
            console.log(`[Signaling] Resetting stale connection for ${requesterId}`);
            try {
                peerConnections.current.get(requesterId)?.close();
                peerConnections.current.delete(requesterId);
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(requesterId);
                    return newMap;
                });
            } catch (e) {
                console.warn("Error closing stale connection:", e);
            }
        }

        const pc = createPeerConnection(requesterId, true);
        if (!pc) return;

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            channel.send({
                type: 'broadcast',
                event: 'offer',
                payload: { target: requesterId, sender: userProfile.id, sdp: offer }
            });
        } catch (err) {
            console.error("Error creating offer:", err);
        }
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (payload.target !== userProfile.id) return;

        const pc = createPeerConnection(payload.sender, false);
        if (!pc) return;

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { target: payload.sender, sender: userProfile.id, sdp: answer }
        });
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        if (payload.target !== userProfile.id) return;

        const pc = peerConnections.current.get(payload.sender);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.target !== userProfile.id) return;
        
        const pc = peerConnections.current.get(payload.sender);
        if (pc && payload.candidate) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) { console.error('Error adding ICE', e); }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
             // Announce presence
             channel.send({
                 type: 'broadcast',
                 event: 'join-request',
                 payload: { userId: userProfile.id }
             });
        }
      });

    return () => {
        channel.unsubscribe();
        presenceChannel.unsubscribe();
        participantsChannel.unsubscribe();
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
    };
  }, [id, userProfile, arena, isStreamActive]);



  useEffect(() => {
    return () => {
        stopStream();
    };
  }, []);

  const loadArena = async (arenaId: string) => {
    try {
      const data = await arenaService.getArenaById(arenaId);
      setArena(data);
      if (data && !spotlightId) {
          setSpotlightId(data.politician_id);
      }
    } catch (error) {
      console.error('Erro ao carregar arena:', error);
      navigate('/arena');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async (arenaId: string) => {
    try {
      const data = await arenaService.getQuestions(arenaId, 'popular');
      setQuestions(prev => {
          if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
          return data;
      });
    } catch (error) {
      console.error('Erro ao carregar perguntas:', error);
    }
  };

  const loadChat = async (arenaId: string) => {
    try {
      const data = await arenaService.getChatMessages(arenaId);
      // Only update if new messages
      if (data.length > 0) {
        setChatMessages(prev => {
            if (prev.length === data.length && prev[prev.length-1]?.id === data[data.length-1]?.id) return prev;
            return data; 
        });
      }
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
    }
  };

  const loadParticipants = async (arenaId: string) => {
        try {
            // console.log('Loading participants for arena:', arenaId);
            const data = await arenaService.getParticipants(arenaId);
            // console.log('Participants loaded:', data.length, data);
            
            // Debug: Check for hand_raised status
            const handRaised = data.filter((p: any) => p.hand_raised);
            if (handRaised.length > 0) {
                console.log('Participants with hand raised (DB):', handRaised.map((p: any) => ({ user: p.user_id, hand: p.hand_raised, updated: p.updated_at })));
            }

            // Only update if data actually changed (deep comparison or simple length/id check)
            setParticipants(prev => {
                if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
                
                // If we have a recent action, maybe we should be careful about overwriting?
                // But loadParticipants is supposed to be the source of truth unless suppressed.
                // If we are here, suppression passed or wasn't active.
                return data;
            });
        } catch (error) {
            console.error('Erro ao carregar participantes:', error);
        }
    };

  const loadStats = async (arenaId: string) => {
    try {
        const { data: arenaData } = await supabase.from('arenas').select('likes_count, shares_count').eq('id', arenaId).single();
        if (arenaData) {
            setLikesCount(arenaData.likes_count || 0);
            setSharesCount(arenaData.shares_count || 0);
        }
        
        // Check if user liked
        if (userProfile) {
            try {
                const { data } = await api.get(`/arenas/${arenaId}/like/status`);
                setHasLiked(data.liked);
            } catch (e) { console.error('Error checking like status', e); }
        }

        // Viewers (Simulated or Realtime Presence)
        // For MVP, using random variation if not implemented in backend, but let's use presence
    } catch (error) {
        console.error('Error loading stats:', error);
    }
  };

  const handleLike = async () => {
    if (!id) return;
    try {
        const { data } = await api.post(`/arenas/${id}/like`);
        setHasLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (error) {
        console.error('Error liking:', error);
    }
  };

  const handleShare = async () => {
    if (!id) return;
    try {
        await api.post(`/arenas/${id}/share`);
        setSharesCount(prev => prev + 1);
        
        // Copy link
        navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
    } catch (error) {
        console.error('Error sharing:', error);
    }
  };

  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
        // 1. Hand Raised (High Priority) - FIFO based on updated_at
        if (a.hand_raised && !b.hand_raised) return -1;
        if (!a.hand_raised && b.hand_raised) return 1;
        if (a.hand_raised && b.hand_raised) {
            // Both raised: Sort by time (approximated by updated_at)
            // Older (smaller timestamp) first -> waiting longer
            const timeA = new Date(a.updated_at || 0).getTime();
            const timeB = new Date(b.updated_at || 0).getTime();
            return timeA - timeB;
        }
        
        // 2. Status (Accepted first)
        if (a.status === 'accepted' && b.status !== 'accepted') return -1;
        if (a.status !== 'accepted' && b.status === 'accepted') return 1;
        
        return 0;
    });
  }, [participants]);

  const handleInviteToStage = async (participant: any, lowerHand: boolean = false) => {
      console.log('[ArenaLive] handleInviteToStage called for:', participant.user_id, 'lowerHand:', lowerHand);
      // 1. Spotlight the user
      setSpotlightId(participant.user_id);
      
      // 2. Grant speak permission and optionally lower hand
      if (canManage) {
          lastActionTime.current = Date.now(); // Suppress polling
          console.log('[ArenaLive] Suppressing polling. Time:', lastActionTime.current);

          const updates: any = {};
          if (!participant.can_speak) updates.can_speak = true;
          if (lowerHand) updates.hand_raised = false;

          console.log('[ArenaLive] Updates to apply:', updates);

          if (Object.keys(updates).length > 0) {
              // Optimistic Update
              setParticipants(prev => prev.map(p => 
                  p.user_id === participant.user_id ? { ...p, ...updates } : p
              ));

              try {
                  console.log('[ArenaLive] Calling API updateParticipantPermissions...');
                  const response = await arenaService.updateParticipantPermissions(id!, participant.user_id, updates);
                  console.log('[ArenaLive] API update success. Response:', response);
                  
                  // Broadcast update to ensure realtime sync
                  if (signalingChannel.current) {
                      console.log('[ArenaLive] Broadcasting permission-update via signaling.');
                      signalingChannel.current.send({
                          type: 'broadcast',
                          event: 'permission-update',
                          payload: { targetId: participant.user_id }
                      });
                  }
                  
                  // Show success message
                  toast.success(`${getUserData(participant.users)?.full_name} agora pode falar!`);
              } catch (error: any) {
                  console.error('Error updating permissions:', error);
                  const errorMsg = error.response?.data?.error || error.message;
                  toast.error(`Erro: ${errorMsg}`);
                  alert(`Erro ao liberar microfone: ${errorMsg}`);
                  if (id) loadParticipants(id); // Revert
              }
          } else {
              console.log('[ArenaLive] No updates needed (already in state).');
              // Even if no updates needed, ensure we broadcast if we just spotlighted?
              // Maybe not needed for permission, but useful for consistency.
          }
      }
  };

  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
        // Use the new public search route
        const { data } = await api.get(`/arenas/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleInviteUser = async (userId: string) => {
    if (!id) return;
    try {
        await arenaService.inviteUser(id, userId, inviteRole);
        alert('Convite enviado!');
        setSearchResults([]);
        setSearchQuery('');
        loadParticipants(id);
    } catch (error) {
        console.error('Erro ao convidar:', error);
        alert('Erro ao enviar convite.');
    }
  };

  const handleRespondInvite = async (status: 'accepted' | 'rejected') => {
    if (!id || !userProfile) return;
    try {
        // Optimistic Update
        setParticipants(prev => prev.map(p => 
            p.user_id === userProfile.id ? { ...p, status } : p
        ));

        await arenaService.updateInviteStatus(id, status);
        loadParticipants(id);
        if (status === 'accepted') {
            // alert('Você entrou na arena como participante! Configure sua câmera e microfone.');
            await initStream();
        }
    } catch (error) {
        console.error('Erro ao responder convite:', error);
        loadParticipants(id); // Revert
    }
  };

  const handleInviteExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;
    
    try {
        const { data } = await api.post(`/arenas/${id}/invite-external`, {
            email: inviteEmail,
            name: inviteName,
            role: inviteRole
        });
        
        if (data.isNewUser && data.tempPassword) {
            setNewUserCreds({ email: inviteEmail, password: data.tempPassword });
        } else {
            alert(data.message || 'Usuário convidado com sucesso!');
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteName('');
        }
        if (id) loadParticipants(id);
    } catch (error: any) {
        console.error('Error inviting external:', error);
        alert('Erro ao convidar usuário externo: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleHand = async () => {
    if (!id || !userProfile) return;
    const myP = participants.find(p => p.user_id === userProfile.id);
    if (!myP) return;

    try {
        const newStatus = !myP.hand_raised;
        // Optimistic update
        lastActionTime.current = Date.now();
        setParticipants(prev => prev.map(p => p.user_id === userProfile.id ? { ...p, hand_raised: newStatus } : p));
        await arenaService.toggleHand(id, newStatus);
    } catch (error) {
        console.error('Error toggling hand:', error);
        if (id) loadParticipants(id); // Revert
    }
  };

  const handleTogglePermission = async (userId: string, type: 'can_speak' | 'can_video', value: boolean) => {
    if (!id) return;
    try {
        lastActionTime.current = Date.now();
        // Optimistic
        setParticipants(prev => prev.map(p => p.user_id === userId ? { ...p, [type]: value } : p));
        await arenaService.updateParticipantPermissions(id, userId, { [type]: value });
        
        // Broadcast update to ensure realtime sync
        if (signalingChannel.current) {
            signalingChannel.current.send({
                type: 'broadcast',
                event: 'permission-update',
                payload: { targetId: userId }
            });
        }
    } catch (error) {
        console.error('Error updating permission:', error);
        if (id) loadParticipants(id);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Auto-prompt for stream setup if host or participant
  useEffect(() => {
    if (canStream && !isStreamActive && !showGreenRoom && !streamRef.current) {
        // We can't auto-call getUserMedia without user interaction in some browsers,
        // but we can set a flag or show a prominent button.
        // However, if this is a response to a button click (like "Aceitar"), we might be able to.
        // For now, we rely on the "Iniciar Câmera" button which we'll make prominent.
    }
  }, [canStream, isStreamActive, showGreenRoom]);

  const initStream = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        streamRef.current = stream;
        setLocalStreamState(stream);
        setShowGreenRoom(true);
    } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Não foi possível acessar a câmera/microfone. Verifique as permissões.");
    }
  };

  const startStream = async () => {
    await initStream();
  };

  useEffect(() => {
    if ((showGreenRoom || isStreamActive) && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
    }
  }, [showGreenRoom, isStreamActive]);

  const stopStream = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    setLocalStreamState(null);
    setIsStreamActive(false);
  };

  const toggleMic = () => {
    if (streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsMicOn(audioTrack.enabled);
        }
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCamOn(videoTrack.enabled);
        }
    }
  };

  const joinRoom = () => {
    setShowGreenRoom(false);
    setIsStreamActive(true);
  };

  const handleGoLive = async () => {
    if (!id) return;
    try {
        await arenaService.updateArena(id, { status: 'live' });
        setArena(prev => prev ? { ...prev, status: 'live' } : null);
        alert("Você está AO VIVO!");
    } catch (error) {
        console.error("Erro ao iniciar live:", error);
        alert("Erro ao iniciar transmissão.");
    }
  };

  const handleEndLive = async () => {
    if (!id) return;
    if (window.confirm("Tem certeza que deseja encerrar a transmissão?")) {
        try {
            await arenaService.updateArena(id, { status: 'ended' });
            setArena(prev => prev ? { ...prev, status: 'ended' } : null);
            stopStream();
            setShowSummary(true);
        } catch (error) {
            console.error("Erro ao encerrar live:", error);
        }
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newQuestion.trim()) return;

    // Restriction: Only Superchat (unless user is admin/mod/host)
    const isPrivileged = userProfile?.role === 'admin' || isPoliticianHost || isModerator;

    try {
      if (superChatAmount > 0) {
        // Super Chat Flow
        const response = await arenaService.createSuperChatSession(id, superChatAmount, newQuestion);
        if (response.success && response.data.url) {
          window.location.href = response.data.url;
        } else {
          alert('Erro ao iniciar pagamento do Super Chat.');
        }
      } else {
        if (!isPrivileged) {
            alert('Nesta arena, apenas perguntas com Superchat são permitidas.');
            return;
        }
        // Normal Question Flow (only for privileged users in this strict mode)
        await arenaService.sendQuestion(id, newQuestion, 'normal', 0);
        setNewQuestion('');
        loadQuestions(id); 
      }
    } catch (error) {
      console.error('Erro ao enviar pergunta:', error);
      alert('Erro ao enviar pergunta. Tente novamente.');
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!id) return;
    if (!window.confirm('Tem certeza que deseja remover este participante?')) return;
    
    try {
      await arenaService.removeParticipant(id, userId);
      setParticipants(prev => prev.filter(p => p.user_id !== userId));
      // Also remove from remote streams if exists
      setRemoteStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(userId);
        return newStreams;
      });
      // toast.success('Participante removido com sucesso');
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Erro ao remover participante');
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newChatMessage.trim()) return;

    try {
        await arenaService.sendChatMessage(id, newChatMessage);
        setNewChatMessage('');
        loadChat(id);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleVote = async (questionId: string) => {
    try {
      await arenaService.voteQuestion(questionId);
      if (id) loadQuestions(id);
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert('Você já votou nesta pergunta!');
      } else {
        console.error('Erro ao votar:', error);
      }
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!arena) return null;

  if (arena.status === 'ended') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <button 
                onClick={() => navigate('/arena')}
                className="mb-6 flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar para a Arena
              </button>

              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-900 h-48 relative flex items-center justify-center">
                    <div className="text-center z-10">
                        <h1 className="text-3xl font-bold text-white mb-2">{arena.title}</h1>
                        <span className="inline-block px-4 py-1 rounded-full bg-gray-700 text-gray-300 text-sm font-bold uppercase tracking-wider border border-gray-600">
                            Encerrado
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>

                <div className="p-8">
                    <div className="flex items-center mb-8">
                        {arena.politicians?.photo_url ? (
                            <img 
                                src={arena.politicians.photo_url} 
                                alt={arena.politicians.name}
                                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md mr-4"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{arena.politicians?.name}</h3>
                            <p className="text-gray-500">{new Date(arena.scheduled_at).toLocaleDateString('pt-BR')} às {new Date(arena.scheduled_at).toLocaleTimeString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Sobre o Evento</h4>
                        <p className="text-gray-700 leading-relaxed">{arena.description}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-center">
                        <p className="text-blue-800 font-medium">
                            Este evento já foi encerrado. Fique atento para as próximas transmissões!
                        </p>
                    </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen h-[100dvh] bg-gray-900 text-white overflow-hidden">
      
      {/* Main Content - Video & Participants */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header Overlay */}
        <div className="absolute top-4 left-4 z-10 flex gap-2 items-center w-full pr-8 pointer-events-none">
            <div className="pointer-events-auto flex gap-2">
                <button 
                    onClick={() => navigate('/arena')}
                    className="bg-black/50 hover:bg-black/70 p-2 rounded-full backdrop-blur-sm transition-all text-white"
                >
                    <X size={20} />
                </button>
                {arena.status === 'live' && (
                    <div className="flex items-center gap-2">
                        <div className="bg-red-600 px-3 py-1 rounded-full flex items-center gap-2 animate-pulse shadow-lg shadow-red-600/20">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            <span className="text-xs font-bold uppercase">AO VIVO</span>
                        </div>
                        <LiveTimer startDate={arena.started_at || arena.updated_at} />
                    </div>
                )}
                
                {/* Stats - Hidden for Host as they have the Dashboard */}
                {!isHost && (
                    <>
                        <div className="bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-2 border border-white/10">
                            <Eye size={14} className="text-blue-400" />
                            <span className="text-xs font-bold">{viewersCount}</span>
                        </div>

                        <button 
                            onClick={handleLike}
                            className={`px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-2 border transition-all ${hasLiked ? 'bg-pink-600/80 border-pink-500 text-white' : 'bg-black/50 border-white/10 text-gray-300 hover:bg-black/70'}`}
                        >
                            <ThumbsUp size={14} className={hasLiked ? 'fill-current' : ''} />
                            <span className="text-xs font-bold">{likesCount}</span>
                        </button>

                        <button 
                            onClick={handleShare}
                            className="bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-2 border border-white/10 text-gray-300 hover:bg-black/70 transition-all"
                        >
                            <Share2 size={14} />
                            <span className="text-xs font-bold hidden sm:inline">Compartilhar</span>
                        </button>
                    </>
                )}
            </div>

            {/* Anchor Dashboard Toggle (Host Only) */}
            {isHost && (
                <div className="ml-auto pointer-events-auto">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg ${showStats ? 'bg-blue-600 text-white' : 'bg-gray-800/90 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
                    >
                        <BarChart2 size={18} />
                        <span className="hidden md:inline font-bold">Painel do Âncora</span>
                    </button>
                </div>
            )}
        </div>

        {/* Anchor Dashboard Panel - REMOVED (Redundant) */}

        
        {/* Video Area */}
        <div className="flex-1 bg-black flex flex-col relative overflow-hidden group min-h-[30vh]">
          {/* Main Spotlight Video (Host/Politician) */}
          <div className="flex-1 relative flex items-center justify-center min-h-0 bg-black">
              {/* Central Video/Avatar Stage */}
              <div className="relative w-full h-full flex items-center justify-center">
                  <CenterStage 
                      spotlightId={spotlightId}
                      hostId={arena?.politician_id}
                      userId={userProfile?.id}
                      localStream={localStreamState}
                      isStreamActive={isStreamActive}
                      showGreenRoom={showGreenRoom}
                      remoteStreams={remoteStreams}
                      participants={participants}
                      arena={arena}
                      getUserData={getUserData}
                      amIHost={isPoliticianHost}
                      isCamOn={isCamOn}
                  />
                  
                  {/* Debug Overlay - REMOVED per user request */}


                {/* Invite Acceptance Banner */}
                {pendingInvite && (
                    <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[200] bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-bounce-in w-[90%] max-w-lg">
                        <div className="flex-1">
                            <p className="font-bold text-lg">Você foi convidado!</p>
                            <p className="text-sm opacity-90">O anfitrião convidou você para participar da bancada.</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleRespondInvite('rejected')}
                                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg font-medium transition-colors"
                            >
                                Recusar
                            </button>
                            <button 
                                onClick={() => handleRespondInvite('accepted')}
                                className="px-4 py-2 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2"
                            >
                                <Check size={18} /> Aceitar
                            </button>
                        </div>
                    </div>
                )}

                {/* Stream Controls Bar (Bottom Center) */}
                  {(() => {
                      // Logic for controls visibility
                      // Use outer scope myParticipant or redefine using currentUserId
                      const participant = myParticipant || participants.find(p => p.user_id === currentUserId);
                      const isAccepted = participant?.status === 'accepted';
                      
                      // Show controls if:
                      // 1. Not in Green Room
                      // 2. Not showing Stats (Anchor Panel) - ONLY if Host
                      // 3. User is Host OR Participant OR has a participant entry OR has permission
                      // 4. Also ensure that if they have permission (canStream), we show it!
                      // 5. DEBUG: Force show for any logged-in user who is not host, to ensure "Raise Hand" is visible
                      const shouldShow = !showGreenRoom && (!isHost || !showStats) && (isHost || !!participant || isAccepted || canStream || (!!user && !isHost));
                      
                      // DOUBLE CHECK: Ensure we don't show if user is Host and Dashboard is active (Redundant check but safe)
                      if (isHost && showStats) return null;

                      if (!shouldShow) return null;

                      // Permission Logic
                      const isPolitician = userProfile?.role === 'politician';
                      const canSpeak = isPolitician || isAccepted || participant?.can_speak;
                      const canVideo = isPolitician || isAccepted || participant?.can_video;
                      const isHandRaised = participant?.hand_raised;

                      // If participant is not found, we can't do actions, so buttons should be disabled
                      const hasParticipantRecord = !!participant;
                      
                      // CRITICAL FIX: If host, always treat as having a record and permissions
                      const effectiveHasRecord = isHost || hasParticipantRecord;
                      const effectiveCanSpeak = isHost || canSpeak;
                      const effectiveCanVideo = isHost || canVideo;

                      return (
                        <>
                        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-[1000] bg-gray-900/90 backdrop-blur-md px-6 py-4 rounded-full border border-gray-700 shadow-2xl transition-all hover:bg-black">
                                <button 
                                    onClick={async () => {
                                        if (isHost && !hasParticipantRecord) {
                                            if (confirm("Você está atuando como Administrador mas não está na lista de participantes.\n\nDeseja entrar na arena como convidado para transmitir áudio/vídeo?")) {
                                                try {
                                                    await arenaService.inviteUser(id!, userProfile?.id!, 'guest');
                                                    await arenaService.updateInviteStatus(id!, 'accepted');
                                                    // Auto-grant permissions for admins
                                                    await arenaService.updateParticipantPermissions(id!, userProfile?.id!, { can_speak: true, can_video: true });
                                                    
                                                    await loadParticipants(id!);
                                                    alert("Você entrou na arena! Agora você pode ativar seu microfone.");
                                                } catch (e: any) {
                                                    alert("Erro ao entrar: " + e.message);
                                                }
                                            }
                                            return;
                                        }

                                        if (!effectiveHasRecord) {
                                            alert("Você não foi identificado como participante desta arena. Tentando atualizar...");
                                            loadParticipants(id!);
                                            return;
                                        }
                                        if (!effectiveCanSpeak) {
                                            alert("O anfitrião ainda não liberou seu microfone.");
                                            // Try to refresh just in case
                                            loadParticipants(id!);
                                            return;
                                        }
                                        !isStreamActive ? initStream() : toggleMic();
                                    }}
                                    className={`p-4 rounded-full transition-all ${(!effectiveCanSpeak || !effectiveHasRecord) ? 'opacity-50 bg-gray-700 text-gray-500' : (!isStreamActive && !showGreenRoom) ? 'bg-gray-700 text-white hover:bg-gray-600' : (!isMicOn) ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'}`}
                                    title={!effectiveHasRecord ? "Você não é um participante (Clique para atualizar)" : !effectiveCanSpeak ? "Sem permissão de áudio (Aguardando anfitrião)" : !isStreamActive ? "Iniciar Transmissão (Áudio)" : isMicOn ? "Desativar Microfone" : "Ativar Microfone"}
                                >
                                    {(!isMicOn) ? <MicOff size={24} /> : <Mic size={24} />}
                                </button>
                                
                                <button 
                                    onClick={async () => {
                                        if (isHost && !hasParticipantRecord) {
                                            if (confirm("Você está atuando como Administrador mas não está na lista de participantes.\n\nDeseja entrar na arena como convidado para transmitir áudio/vídeo?")) {
                                                try {
                                                    await arenaService.inviteUser(id!, userProfile?.id!, 'guest');
                                                    await arenaService.updateInviteStatus(id!, 'accepted');
                                                    // Auto-grant permissions for admins
                                                    await arenaService.updateParticipantPermissions(id!, userProfile?.id!, { can_speak: true, can_video: true });

                                                    await loadParticipants(id!);
                                                    alert("Você entrou na arena! Agora você pode ativar sua câmera.");
                                                } catch (e: any) {
                                                    alert("Erro ao entrar: " + e.message);
                                                }
                                            }
                                            return;
                                        }

                                        if (!effectiveHasRecord) {
                                            const debugInfo = `Seu ID: ${currentUserId || 'N/A'}\nTotal Participantes: ${participants.length}\nIDs na lista: ${participants.map(p => p.user_id.substring(0,6)).join(', ')}`;
                                            console.error('Debug Identificação:', { currentUserId, participants });
                                            alert(`Você não foi identificado como participante.\n\nDados Técnicos:\n${debugInfo}`);
                                            loadParticipants(id!);
                                            return;
                                        }
                                        if (!effectiveCanVideo) {
                                            alert("O anfitrião ainda não liberou sua câmera.");
                                            loadParticipants(id!);
                                            return;
                                        }
                                        !isStreamActive ? initStream() : toggleCam();
                                    }}
                                    className={`p-4 rounded-full transition-all ${(!effectiveCanVideo || !effectiveHasRecord) ? 'opacity-50 bg-gray-700 text-gray-500' : (!isStreamActive && !showGreenRoom) ? 'bg-gray-700 text-white hover:bg-gray-600' : (!isCamOn) ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'}`}
                                    title={!effectiveHasRecord ? "Você não é um participante (Clique para atualizar)" : !effectiveCanVideo ? "Sem permissão de vídeo (Aguardando anfitrião)" : !isStreamActive ? "Iniciar Transmissão (Vídeo)" : isCamOn ? "Desativar Câmera" : "Ativar Câmera"}
                                >
                                    {(!isCamOn) ? <VideoOff size={24} /> : <Video size={24} />}
                                </button>

                                <button 
                                    onClick={async () => {
                                        if (isHost && !hasParticipantRecord) {
                                            if (confirm("Você está atuando como Administrador mas não está na lista de participantes.\n\nDeseja entrar na arena como convidado para levantar a mão?")) {
                                                try {
                                                    await arenaService.inviteUser(id!, userProfile?.id!, 'guest');
                                                    await arenaService.updateInviteStatus(id!, 'accepted');
                                                    await loadParticipants(id!);
                                                    alert("Você entrou na arena! Agora você pode levantar a mão.");
                                                } catch (e: any) {
                                                    alert("Erro ao entrar: " + e.message);
                                                }
                                            }
                                            return;
                                        }

                                        if (!effectiveHasRecord) {
                                            // Unreachable for host now due to check above, but kept for non-host errors
                                            const debugInfo = `Seu ID: ${currentUserId || 'N/A'}\nTotal Participantes: ${participants.length}\nIDs na lista: ${participants.map(p => p.user_id.substring(0,6)).join(', ')}`;
                                            console.error('Debug Identificação:', { currentUserId, participants });
                                            alert(`Você não foi identificado como participante.\n\nDados Técnicos:\n${debugInfo}`);
                                            loadParticipants(id!);
                                            return;
                                        }
                                        handleToggleHand();
                                    }}
                                    className={`p-4 rounded-full transition-all ${(!effectiveHasRecord && !isHost) ? 'opacity-50 bg-gray-700 text-gray-500' : isHandRaised ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30 hover:bg-yellow-400' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                    title={(!effectiveHasRecord && !isHost) ? "Você não é um participante" : isHandRaised ? "Abaixar a mão" : "Levantar a mão"}
                                >
                                    <Hand size={24} className={isHandRaised ? 'fill-current' : ''} />
                                </button>

                                {isHost && (
                                    <button 
                                        onClick={() => setShowStats(!showStats)}
                                        className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-all ml-2 border-l border-gray-600"
                                        title="Painel do Âncora"
                                    >
                                        <Settings size={24} />
                                    </button>
                                )}
                        </div>

                        {/* Diagnostics for missing participant link - DISABLED for production/user request */}
                        {/* 
                        {!hasParticipantRecord && user && (
                             <div className="fixed top-32 left-1/2 transform -translate-x-1/2 bg-black/80 text-red-300 text-xs p-4 rounded-lg border border-red-500/30 backdrop-blur-md z-[2000] max-w-md w-full text-center shadow-2xl pointer-events-auto">
                                 <div className="flex justify-between items-center mb-2 border-b border-red-500/30 pb-1">
                                    <p className="font-bold">⚠️ Diagnóstico: Vínculo Perdido</p>
                                    <button onClick={() => loadParticipants(id!)} className="p-1 hover:bg-white/10 rounded"><RefreshCw size={12} /></button>
                                 </div>
                                 <p className="mb-2">O sistema não reconheceu você como participante desta arena.</p>
                                 <div className="bg-black/50 p-2 rounded mb-2 font-mono text-[10px] text-left overflow-auto max-h-24">
                                     <p>Seu ID: {currentUserId}</p>
                                     <p>IDs na sala ({participants.length}): {participants.map(p => p.user_id.substring(0,8)).join(', ')}...</p>
                                 </div>
                                 <button 
                                    onClick={() => loadParticipants(id!)} 
                                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold w-full"
                                 >
                                     Forçar Atualização da Lista
                                 </button>
                             </div>
                        )}
                        */}
                        </>
                      );
                  })()}

                   {/* Green Room Overlay - Only if I am preparing AND Dashboard is closed */}
                   {showGreenRoom && !showStats && (
                       <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                           <h2 className="text-2xl font-bold mb-6">Sala de Preparação</h2>
                           <div className="w-full max-w-md aspect-video bg-black rounded-lg mb-6 overflow-hidden relative border border-gray-700">
                                <StreamVideoPlayer 
                                    stream={streamRef.current}
                                    className={`w-full h-full object-cover ${isCamOn ? '' : 'hidden'}`}
                                    muted={true}
                                    mirror={true}
                                />
                                {!isCamOn && (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                        <VideoOff size={48} />
                                    </div>
                                )}
                           </div>

                           <div className="flex gap-4 mb-8">
                               <button 
                                   onClick={toggleMic}
                                   className={`p-4 rounded-full ${isMicOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                               >
                                   {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                               </button>
                               <button 
                                   onClick={toggleCam}
                                   className={`p-4 rounded-full ${isCamOn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
                               >
                                   {isCamOn ? <Video size={24} /> : <VideoOff size={24} />}
                               </button>
                           </div>
                           <div className="flex gap-4">
                               <button 
                                   onClick={() => setShowGreenRoom(false)}
                                   className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded font-medium"
                               >
                                   Cancelar
                               </button>
                               <button 
                                   onClick={joinRoom}
                                   className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded font-bold"
                               >
                                   Entrar na Arena
                               </button>
                           </div>
                       </div>
                   )}
              </div>
          </div>



          {/* Anchor Dashboard Overlay (Consolidated) */}
          {isHost && showStats && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn pointer-events-none">
                <div className="bg-gray-900 w-full max-w-4xl rounded-xl border border-gray-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden pointer-events-auto">
                    {/* Dashboard Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-gray-800/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-500/20 p-2 rounded-lg">
                                <BarChart2 className="w-6 h-6 text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Painel do Âncora</h2>
                                <p className="text-sm text-gray-400">Controle da transmissão e audiência</p>
                            </div>
                        </div>
                        <button onClick={() => setShowStats(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                            <X className="w-6 h-6 text-gray-400 hover:text-white" />
                        </button>
                    </div>

                    {/* Dashboard Content */}
                    <div className="flex-1 overflow-y-auto p-6 pb-32">
                        {/* Live Stats Grid - Removed as per user request (redundant with main screen overlay) */}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Stream Controls */}
                            <div className="md:col-span-1 space-y-4">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                                    <Settings className="w-5 h-5 mr-2 text-gray-400" />
                                    Controles da Live
                                </h3>
                                <div className="bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-700/50">
                                    {arena.status !== 'live' ? (
                                        <button 
                                            onClick={() => { handleGoLive(); setShowStats(false); }}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-green-900/20"
                                        >
                                            <Play size={20} /> INICIAR TRANSMISSÃO
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => { handleEndLive(); setShowStats(false); }}
                                            className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-red-900/20"
                                        >
                                            <Square size={20} /> ENCERRAR TRANSMISSÃO
                                        </button>
                                    )}
                                    
                                    {(() => {
                                        const myParticipant = participants.find(p => p.user_id === userProfile?.id);
                                        const canSpeak = userProfile?.role === 'politician' || myParticipant?.can_speak;
                                        const canVideo = userProfile?.role === 'politician' || myParticipant?.can_video;
                                        const isHandRaised = myParticipant?.hand_raised;

                                        return (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        onClick={toggleMic}
                                                        disabled={!canSpeak}
                                                        className={`py-3 rounded-lg font-medium flex flex-col items-center justify-center gap-1 transition-colors ${!canSpeak ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500' : isMicOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                                                        title={!canSpeak ? "Você precisa de permissão para falar" : ""}
                                                    >
                                                        {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
                                                        <span className="text-xs">{!canSpeak ? 'Sem Permissão' : isMicOn ? 'Microfone ON' : 'Microfone OFF'}</span>
                                                    </button>
                                                    <button 
                                                        onClick={toggleCam}
                                                        disabled={!canVideo}
                                                        className={`py-3 rounded-lg font-medium flex flex-col items-center justify-center gap-1 transition-colors ${!canVideo ? 'opacity-50 cursor-not-allowed bg-gray-800 text-gray-500' : isCamOn ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                                                        title={!canVideo ? "Você precisa de permissão para ligar a câmera" : ""}
                                                    >
                                                        {isCamOn ? <Video size={20} /> : <VideoOff size={20} />}
                                                        <span className="text-xs">{!canVideo ? 'Sem Permissão' : isCamOn ? 'Câmera ON' : 'Câmera OFF'}</span>
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={handleToggleHand}
                                                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isHandRaised ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                                >
                                                    <Hand size={20} className={isHandRaised ? 'fill-black' : ''} />
                                                    {isHandRaised ? 'Abaixar a Mão' : 'Levantar a Mão'}
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Participants Management */}
                            <div className="md:col-span-2">
                                {/* Hand Raise Queue */}
                                {participants.some(p => p.hand_raised) && (
                                    <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl overflow-hidden animate-pulse-slow">
                                        <div className="p-3 bg-yellow-500/20 flex items-center gap-2">
                                            <Hand size={18} className="text-yellow-500 fill-current animate-bounce" />
                                            <h3 className="font-bold text-yellow-500 text-sm">Fila de Mãos Levantadas</h3>
                                            <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                                                {participants.filter(p => p.hand_raised).length}
                                            </span>
                                        </div>
                                        <div className="divide-y divide-yellow-500/10">
                                            {participants.filter(p => p.hand_raised).map(p => {
                                                 const pUser = getUserData(p.users);
                                                 return (
                                                     <div key={`queue-${p.id}`} className="p-3 flex items-center justify-between hover:bg-yellow-500/5 transition-colors">
                                                         <div className="flex items-center gap-3">
                                                             <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-yellow-500/30">
                                                                 <img 
                                                                    src={pUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(pUser?.full_name || 'U')}&background=random`} 
                                                                    className="w-full h-full object-cover" 
                                                                    alt={pUser?.full_name}
                                                                 />
                                                             </div>
                                                             <div>
                                                                 <p className="font-bold text-sm text-white">{pUser?.full_name}</p>
                                                                 <p className="text-xs text-yellow-500/80">Solicitou a palavra</p>
                                                             </div>
                                                         </div>
                                                         <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleInviteToStage(p, true)} 
                                                                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-lg shadow-yellow-500/20"
                                                            >
                                                                <Mic size={12} /> Liberar Microfone
                                                            </button>
                                                         </div>
                                                     </div>
                                                 );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center">
                                        <Users className="w-5 h-5 mr-2 text-gray-400" />
                                        Gerenciar Participantes
                                    </h3>
                                    <button 
                                        onClick={() => setShowInviteModal(true)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                                    >
                                        <UserPlus size={16} /> Convidar Novo
                                    </button>
                                </div>
                                
                                <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700/50">
                                    {participants.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            <Users size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>Nenhum participante convidado ainda.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-700/50">
                                            {sortedParticipants.map(p => {
                                                const pUser = getUserData(p.users);
                                                const isSelf = p.user_id === userProfile?.id;
                                                const stream = isSelf && streamRef.current ? streamRef.current : remoteStreams.get(p.user_id) || null;
                                                // Allow video if accepted, regardless of explicit permission flag for now, or if permission is true
                                                // Show video if stream exists AND (stream is active OR it's not me OR I am in green room)
                                                const hasVideo = (p.can_video || p.status === 'accepted') && (!!stream && (isStreamActive || !isSelf || showGreenRoom));
                                                
                                                return (
                                                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-750 transition-colors">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <div className="relative w-16 h-16 flex-shrink-0 bg-black rounded-lg overflow-hidden border border-gray-700">
                                                            {hasVideo ? (
                                                                <StreamVideoPlayer
                                                                    stream={stream}
                                                                    className="w-full h-full object-cover"
                                                                    muted={isSelf}
                                                                    mirror={isSelf}
                                                                />
                                                            ) : (
                                                                (() => {
                                                                    const avatarUrl = pUser?.avatar_url;
                                                                    const name = pUser?.full_name || 'Participante';
                                                                    const src = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
                                                                    
                                                                    return (
                                                                        <img src={src} className="w-full h-full object-cover" alt={name} />
                                                                    );
                                                                })()
                                                            )}
                                                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${p.status === 'accepted' ? 'bg-green-500' : p.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                                            {p.hand_raised && (
                                                                <div className="absolute top-0 right-0 bg-yellow-500 text-black rounded-bl-lg p-1 shadow-lg animate-bounce z-10">
                                                                    <Hand size={12} fill="black" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate text-white">{pUser?.full_name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">
                                                                    {p.role === 'journalist' ? 'Jornalista' : p.role === 'guest' ? 'Convidado' : p.role}
                                                                </span>
                                                                {p.status === 'invited' && <span className="text-yellow-500 bg-yellow-500/10 px-1.5 rounded text-[10px]">Pendente</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Admin Controls */}
                                                    <div className="flex items-center gap-2">
                                                        {(userProfile?.role === 'politician' || userProfile?.role === 'admin') && p.user_id !== userProfile.id && (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleTogglePermission(p.user_id, 'can_speak', !p.can_speak)}
                                                                    className={`p-2 rounded-lg transition-colors ${p.can_speak ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' : 'text-gray-500 hover:text-gray-300'}`}
                                                                    title={p.can_speak ? "Revogar áudio" : "Permitir áudio"}
                                                                >
                                                                    {p.can_speak ? <Mic size={16} /> : <MicOff size={16} />}
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleTogglePermission(p.user_id, 'can_video', !p.can_video)}
                                                                    className={`p-2 rounded-lg transition-colors ${p.can_video ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' : 'text-gray-500 hover:text-gray-300'}`}
                                                                    title={p.can_video ? "Revogar vídeo" : "Permitir vídeo"}
                                                                >
                                                                    {p.can_video ? <Video size={16} /> : <VideoOff size={16} />}
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRemoveParticipant(p.user_id)}
                                                                    className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                    title="Remover participante"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Viewers Overlay (For everyone) */}
          {!isHost && (
             <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 text-sm border border-white/10">
                     <Eye size={16} className="text-red-500" />
                     <span className="font-bold">{viewersCount}</span>
                 </div>
                 <button 
                    onClick={handleLike}
                    className={`bg-black/60 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 text-sm border border-white/10 transition-colors ${hasLiked ? 'text-blue-400 border-blue-500/30' : 'hover:bg-white/10'}`}
                 >
                     <ThumbsUp size={16} className={hasLiked ? 'fill-blue-400' : ''} />
                     <span>{likesCount}</span>
                 </button>
                 <button 
                    onClick={handleShare}
                    className="bg-black/60 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 text-sm border border-white/10 hover:bg-white/10"
                 >
                     <Share2 size={16} />
                     <span>Share</span>
                 </button>
             </div>
          )}


          
                {/* Overlay Info & Stats */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 md:p-8 pointer-events-none z-40">
                    <div className="flex justify-between items-end">
                        <div className="max-w-[40%] md:max-w-[60%]">
                            <h1 className="text-xl md:text-3xl font-bold truncate">{arena.title}</h1>
                            <div className="flex items-center mt-1 md:mt-2 flex-wrap gap-2">
                                {arena.status === 'live' && (
                                <div className="flex items-center mr-2">
                                    <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold animate-pulse shadow-red-500/50 shadow-lg">AO VIVO</span>
                                    <LiveTimer startDate={arena.started_at || arena.updated_at} />
                                </div>
                            )}
                                <span className="text-sm md:text-lg truncate block">{arena.politicians?.name}</span>
                                <div className="flex items-center bg-black/40 px-2 py-1 rounded text-xs text-gray-300 whitespace-nowrap">
                                    <Eye className="w-3 h-3 mr-1" />
                                    {viewersCount} assistindo
                                </div>
                            </div>
                        </div>
                        
                        {/* Interaction Buttons (Pointer events enabled) */}
                        <div className="flex gap-2 pointer-events-auto">
                            <button 
                                onClick={handleLike}
                                className={`flex items-center gap-1 px-3 py-2 rounded-full backdrop-blur-sm transition-colors ${hasLiked ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                            >
                                <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                                <span className="text-sm font-bold">{likesCount}</span>
                            </button>
                            <button 
                                onClick={handleShare}
                                className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm font-bold">{sharesCount}</span>
                            </button>
                            {isHost && (
                                <button 
                                    onClick={() => setShowStats(!showStats)}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-full backdrop-blur-sm transition-colors ${showStats ? 'bg-yellow-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}
                                >
                                    <BarChart2 className="w-4 h-4" />
                                    <span className="text-sm font-bold hidden md:inline">Dashboard</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>




        </div>

        {/* Participants Grid */}
        <div className="bg-gray-900 border-t border-gray-800 p-4 flex-shrink-0 z-30 relative">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sabatinadores & Convidados</h3>
                {canInvite && (
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-500 flex items-center shadow-lg"
                    >
                        <UserPlus className="w-3 h-3 mr-1" /> Convidar
                    </button>
                )}
             </div>
             <div className="flex gap-2 overflow-x-auto pb-2 min-h-[110px] items-center">
                {/* Host Card (Always First) */}
                <div 
                    onClick={() => setSpotlightId(arena.politician_id)}
                    className={`w-32 h-24 bg-gray-800 rounded relative group flex-shrink-0 overflow-hidden border cursor-pointer transition-all ${spotlightId === arena.politician_id ? 'border-yellow-500 ring-2 ring-yellow-500/30' : 'border-gray-700 hover:border-gray-500'}`}
                >
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                        {(isPoliticianHost && streamRef.current && isStreamActive) ? (
                             <StreamVideoPlayer
                                 stream={streamRef.current}
                                 className="w-full h-full object-cover"
                                 muted={true}
                                 mirror={true}
                             />
                        ) : remoteStreams.has(arena.politician_id) ? (
                             <StreamVideoPlayer
                                 stream={remoteStreams.get(arena.politician_id)!}
                                 className="w-full h-full object-cover"
                             />
                        ) : (
                             arena.politicians?.photo_url ? (
                                 <img src={arena.politicians.photo_url} className="w-full h-full object-cover" alt="Host" />
                             ) : (
                                 <Users className="w-8 h-8 text-gray-600" />
                             )
                        )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                        <p className="text-xs font-bold truncate text-yellow-400">👑 {arena.politicians?.name}</p>
                        <p className="text-[10px] text-gray-400">Anfitrião</p>
                    </div>
                     {/* Live Indicator if stream exists */}
                     {remoteStreams.has(arena.politician_id) && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                </div>

                {/* Other Participants */}
                {sortedParticipants.map(p => {
                   const pUser = getUserData(p.users);
                   const isSelf = p.user_id === userProfile?.id;
                   const stream = isSelf && streamRef.current ? streamRef.current : remoteStreams.get(p.user_id) || null;
                   
                   return (
                   <div 
                        key={p.id} 
                        onClick={() => handleInviteToStage(p)}
                        className={`w-32 h-24 bg-gray-800 rounded relative group flex-shrink-0 overflow-hidden border cursor-pointer transition-all ${spotlightId === p.user_id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-700 hover:border-gray-500'}`}
                   >
                      {/* Video/Avatar Area */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                          {/* Stream Video */}
                          {(stream && (isStreamActive || !isSelf)) ? (
                              <StreamVideoPlayer
                                  stream={stream}
                                  className="w-full h-full object-cover"
                                  muted={isSelf}
                                  mirror={isSelf}
                              />
                          ) : (
                              <>
                                <img 
                                    src={pUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(pUser?.full_name || 'Participante')}&background=random&color=fff&size=128`}
                                    alt={pUser?.full_name || 'Participante'}
                                    className="w-full h-full object-cover opacity-80"
                                    onError={(e) => { 
                                        (e.target as HTMLImageElement).style.display = 'none'; 
                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                    }} 
                                />
                                <div className="hidden absolute inset-0 flex items-center justify-center">
                                    <Users className="w-8 h-8 text-gray-600" />
                                </div>
                              </>
                          )}
                      </div>
                      
                      {/* Name Label */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1">
                          <p className="text-xs font-bold truncate text-white">{pUser?.full_name}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{p.role === 'journalist' ? 'Jornalista' : p.role}</p>
                      </div>

                      {/* Status */}
                      {p.status === 'invited' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                              <span className="text-xs text-yellow-400 font-bold animate-pulse">Convidado...</span>
                          </div>
                      )}
                      
                      {/* Active Video Indicator */}
                      {(remoteStreams.has(p.user_id) || (p.user_id === userProfile?.id && isStreamActive)) && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                   </div>
                );
                })}
                
                {/* Empty Slots Placeholders (Always show at least 4 slots) */}
                {Array.from({ length: Math.max(0, 4 - participants.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-32 h-24 bg-gray-800/50 rounded border border-gray-700/50 flex flex-col items-center justify-center text-gray-600 flex-shrink-0 border-dashed">
                        <Users className="w-6 h-6 mb-1 opacity-50" />
                        <span className="text-[10px]">Livre</span>
                    </div>
                ))}
             </div>
          </div>
      </div>
      <div className="w-full md:w-96 h-[40vh] md:h-full flex-shrink-0 bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col z-20">
        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button 
            className={`flex-1 py-3 font-medium ${activeTab === 'questions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('questions')}
          >
            Perguntas
          </button>
          <button 
            className={`flex-1 py-3 font-medium ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'questions' ? (
            questions.length === 0 ? (
              <p className="text-center text-gray-500 mt-10">Seja o primeiro a perguntar!</p>
            ) : (
              questions.map((q) => (
                <div key={q.id} className={`p-3 rounded-lg ${q.type === 'superchat' ? 'bg-yellow-900/30 border border-yellow-600/50' : 'bg-gray-700'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-500 mr-2 overflow-hidden flex items-center justify-center">
                            {q.users?.avatar_url ? (
                                <img 
                                    src={q.users.avatar_url} 
                                    alt="User" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                                />
                            ) : null}
                            <span className={`text-xs ${q.users?.avatar_url ? 'hidden' : ''}`}>{q.users?.full_name?.[0]}</span>
                        </div>
                        <span className={`text-sm font-bold ${q.type === 'superchat' ? 'text-yellow-400' : 'text-gray-300'}`}>
                            {q.users?.full_name || 'Usuário'}
                        </span>
                    </div>
                    {q.type === 'superchat' && (
                        <span className="bg-yellow-600 text-black text-xs font-bold px-2 py-0.5 rounded">
                            R$ {q.amount}
                        </span>
                    )}
                  </div>
                  <p className="text-sm mb-3">{q.content}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <button 
                        onClick={() => handleVote(q.id)}
                        className="flex items-center hover:text-blue-400 transition-colors"
                    >
                        👍 <span className="ml-1">{q.priority_score} votos</span>
                    </button>
                    {q.is_answered && (
                        <span className="text-green-400 flex items-center">
                            ✅ Respondida
                        </span>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="flex flex-col h-full">
                {chatMessages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Seja o primeiro a comentar!
                    </div>
                ) : (
                    <div className="flex-1 space-y-3 pb-2">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className="flex items-start animate-fadeIn">
                                <div className="w-8 h-8 rounded-full bg-gray-600 mr-2 overflow-hidden flex-shrink-0">
                                    {(() => {
                                        const msgUser = getUserData(msg.users);
                                        return msgUser?.avatar_url ? (
                                            <img src={msgUser.avatar_url} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-white font-bold bg-blue-600">
                                                {msgUser?.full_name?.[0] || 'U'}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div>
                                    <div className="flex items-baseline">
                                        <span className={`text-sm font-bold mr-2 ${getUserData(msg.users)?.role === 'politician' ? 'text-blue-400' : 'text-gray-300'}`}>
                                            {getUserData(msg.users)?.full_name || 'Usuário'}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-200 break-all">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
            {activeTab === 'questions' ? (
                <form onSubmit={handleSendQuestion}>
                    <div className="mb-2 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                        {arena.superchat_config?.levels?.map((level: any) => (
                            <button
                                key={level.amount}
                                type="button"
                                onClick={() => setSuperChatAmount(level.amount)}
                                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border border-${level.color}-500 transition-all ${superChatAmount === level.amount ? `bg-${level.color}-600 text-white scale-105 shadow-lg` : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                            >
                                R$ {level.amount} - {level.label}
                            </button>
                        ))}
                    </div>

                    {superChatAmount > 0 ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Sua pergunta em destaque..."
                                className="flex-1 bg-gray-700 border border-yellow-600/50 rounded px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                            />
                            <button 
                                type="submit"
                                className="bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded text-sm font-bold"
                            >
                                Enviar
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-4 bg-gray-700/50 rounded border border-gray-600 border-dashed">
                            <p className="text-sm text-gray-400 mb-2">Perguntas são exclusivas para Super Chat.</p>
                            <p className="text-xs text-gray-500">Selecione um valor acima para enviar sua pergunta em destaque.</p>
                        </div>
                    )}
                </form>
            ) : (
                <form onSubmit={handleSendChat} className="flex gap-2">
                    <input
                        type="text"
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 bg-gray-700 text-white rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        type="submit"
                        disabled={!newChatMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold"
                    >
                        ➤
                    </button>
                </form>
            )}
        </div>
      </div>
      {/* Invitation Modal (For Host to invite others) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-800 w-full max-w-md rounded-lg border border-gray-700 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Convidar Participante</h3>
                    <button onClick={() => { setShowInviteModal(false); setNewUserCreds(null); }}><X className="w-6 h-6" /></button>
                </div>

                {newUserCreds ? (
                    <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-lg mb-4">
                        <h4 className="font-bold text-green-400 mb-2">Usuário Criado!</h4>
                        <p className="text-sm text-gray-300 mb-2">Envie estas credenciais para o convidado:</p>
                        <div className="bg-black/50 p-3 rounded text-sm font-mono select-all">
                            <p>Email: <span className="text-white">{newUserCreds.email}</span></p>
                            <p>Senha: <span className="text-white">{newUserCreds.password}</span></p>
                        </div>
                        <p className="text-xs text-yellow-500 mt-2">Atenção: Copie agora, a senha não será mostrada novamente.</p>
                        <button 
                            onClick={() => { setNewUserCreds(null); setShowInviteModal(false); }}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-2"
                        >
                            Fechar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex gap-2 mb-4 bg-gray-700 p-1 rounded">
                            <button 
                                onClick={() => setInviteMode('search')}
                                className={`flex-1 py-1 rounded text-sm font-bold ${inviteMode === 'search' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Search className="w-4 h-4 inline mr-1" /> Buscar
                            </button>
                            <button 
                                onClick={() => setInviteMode('email')}
                                className={`flex-1 py-1 rounded text-sm font-bold ${inviteMode === 'email' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Users className="w-4 h-4 inline mr-1" /> Externo
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-400 mb-1">Papel</label>
                            <select 
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="w-full bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="journalist">Jornalista (Sabatinador)</option>
                                <option value="guest">Convidado</option>
                                <option value="moderator">Moderador</option>
                            </select>
                        </div>

                        {inviteMode === 'search' ? (
                            <form onSubmit={handleSearchUsers} className="mb-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar por nome..."
                                        className="flex-1 bg-gray-700 text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button 
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded"
                                    >
                                        <Search className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleInviteExternal} className="mb-4 space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={inviteName}
                                        onChange={(e) => setInviteName(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded p-2"
                                        placeholder="Nome do convidado"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full bg-gray-700 text-white rounded p-2"
                                        placeholder="email@exemplo.com"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" /> Enviar Convite
                                </button>
                            </form>
                        )}

                        {inviteMode === 'search' && (
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {searchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded hover:bg-gray-700">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gray-600 rounded-full overflow-hidden">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                                                        {user.full_name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{user.full_name}</p>
                                                <p className="text-xs text-gray-400">{user.role}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleInviteUser(user.id)}
                                            className="text-blue-400 hover:text-blue-300 text-sm font-bold"
                                        >
                                            Convidar
                                        </button>
                                    </div>
                                ))}
                                {searchQuery && searchResults.length === 0 && (
                                    <p className="text-center text-gray-500 text-sm py-2">Nenhum usuário encontrado.</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      )}

      {/* Invitation Acceptance Modal (For Invited User) */}
      {(() => {
        const myInvite = participants.find(p => p.user_id === userProfile?.id && p.status === 'invited');
        if (myInvite) {
            return (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                    <div className="bg-gray-800 w-full max-w-lg rounded-xl border border-blue-500/50 p-8 shadow-2xl shadow-blue-500/20 text-center">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/50 animate-pulse">
                            <UserPlus className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Você foi convidado!</h2>
                        <p className="text-gray-300 mb-8 text-lg">
                            Você foi convidado para participar desta Arena como <span className="text-blue-400 font-bold uppercase">{myInvite.role === 'journalist' ? 'Jornalista' : myInvite.role}</span>.
                            <br/>Deseja aceitar o convite e entrar ao vivo?
                        </p>
                        
                        <div className="flex gap-4 justify-center">
                            <button 
                                onClick={() => handleRespondInvite('rejected')}
                                className="px-6 py-3 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-gray-700 transition-colors border border-gray-600"
                            >
                                Recusar
                            </button>
                            <button 
                                onClick={() => handleRespondInvite('accepted')}
                                className="px-8 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all transform hover:scale-105 shadow-lg shadow-blue-600/30 flex items-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Aceitar e Entrar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
      })()}

      {/* Stream Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-gray-800 w-full max-w-2xl rounded-xl border border-gray-700 shadow-2xl p-8 text-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-green-500"></div>
                
                <h2 className="text-3xl font-bold text-white mb-2">Transmissão Encerrada</h2>
                <p className="text-gray-400 mb-8">Confira os resultados da sua live</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <Eye size={32} className="mx-auto mb-2 text-blue-400" />
                        <p className="text-2xl font-bold text-white">{viewersCount}</p>
                        <p className="text-xs text-gray-400 uppercase">Espectadores</p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <ThumbsUp size={32} className="mx-auto mb-2 text-pink-400" />
                        <p className="text-2xl font-bold text-white">{likesCount}</p>
                        <p className="text-xs text-gray-400 uppercase">Curtidas</p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <Share2 size={32} className="mx-auto mb-2 text-purple-400" />
                        <p className="text-2xl font-bold text-white">{sharesCount}</p>
                        <p className="text-xs text-gray-400 uppercase">Compartilhamentos</p>
                    </div>
                    <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                        <BarChart2 size={32} className="mx-auto mb-2 text-yellow-400" />
                        <p className="text-2xl font-bold text-white">{questions.length}</p>
                        <p className="text-xs text-gray-400 uppercase">Perguntas</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => navigate('/arena')}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-transform hover:scale-[1.02]"
                >
                    Voltar para o Painel
                </button>
            </div>
        </div>
      )}
    </div>
  );
};


export default ArenaLive;
