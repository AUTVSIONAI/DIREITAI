import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { arenaService, Arena, ArenaQuestion } from '../services/arena';
import Header from '../components/user/Header';
import Sidebar from '../components/user/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Video, Mic, MicOff, VideoOff, Play, Square, Settings, Users } from 'lucide-react';

const ArenaLive = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [arena, setArena] = useState<Arena | null>(null);
  const [questions, setQuestions] = useState<ArenaQuestion[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'questions'>('questions');
  const [superChatAmount, setSuperChatAmount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WebRTC & Streaming State
  const [viewersCount, setViewersCount] = useState(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map()); // Broadcaster stores PCs per viewer
  const viewerPeerConnection = useRef<RTCPeerConnection | null>(null); // Viewer stores single PC
  const signalingChannel = useRef<any>(null);

  // Broadcaster State
  const [isBroadcaster, setIsBroadcaster] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showGreenRoom, setShowGreenRoom] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (id) {
      loadArena(id);
      loadQuestions(id);
      loadChat(id);
      
      const interval = setInterval(() => {
        loadQuestions(id);
        loadChat(id);
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

  useEffect(() => {
    if (arena && userProfile) {
        // Check if current user is the politician for this arena
        if (userProfile.role === 'politician' && userProfile.politician_id === arena.politician_id) {
            setIsBroadcaster(true);
        }
    }
  }, [arena, userProfile]);

  // WebRTC Signaling Logic
  useEffect(() => {
    if (!id || !userProfile || !arena) return;

    const channel = supabase.channel(`arena_signaling_${id}`);
    signalingChannel.current = channel;

    const rtcConfig = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    channel
      .on('broadcast', { event: 'viewer-join' }, async ({ payload }) => {
        // Only broadcaster handles new viewers
        if (!isBroadcaster || !isStreamActive || !streamRef.current) return;
        
        const { viewerId } = payload;
        console.log(`Viewer joined: ${viewerId}`);
        
        // Limit peers to avoid killing mobile CPU
        if (peerConnections.current.size >= 5) {
            console.warn('Max viewers reached for P2P');
            return;
        }

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnections.current.set(viewerId, pc);

        // Add local tracks
        streamRef.current.getTracks().forEach(track => {
            pc.addTrack(track, streamRef.current!);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: { target: viewerId, candidate: event.candidate }
                });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        channel.send({
            type: 'broadcast',
            event: 'offer',
            payload: { target: viewerId, sdp: offer }
        });
      })
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        // Viewer receives offer
        if (isBroadcaster || payload.target !== userProfile.id) return;

        const pc = new RTCPeerConnection(rtcConfig);
        viewerPeerConnection.current = pc;

        pc.ontrack = (event) => {
            console.log('Received remote track');
            setRemoteStream(event.streams[0]);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                channel.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: { target: 'broadcaster', sender: userProfile.id, candidate: event.candidate }
                });
            }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
            type: 'broadcast',
            event: 'answer',
            payload: { target: 'broadcaster', sender: userProfile.id, sdp: answer }
        });
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        // Broadcaster receives answer
        if (!isBroadcaster || payload.target !== 'broadcaster') return;

        const pc = peerConnections.current.get(payload.sender);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (isBroadcaster) {
            if (payload.target !== 'broadcaster') return;
            const pc = peerConnections.current.get(payload.sender);
            if (pc && payload.candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch (e) { console.error('Error adding ICE', e); }
            }
        } else {
            if (payload.target !== userProfile.id) return;
            const pc = viewerPeerConnection.current;
            if (pc && payload.candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
                } catch (e) { console.error('Error adding ICE', e); }
            }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
             if (!isBroadcaster && arena.status === 'live') {
                 // Announce presence to request stream
                 channel.send({
                     type: 'broadcast',
                     event: 'viewer-join',
                     payload: { viewerId: userProfile.id }
                 });
             }
        }
      });

    return () => {
        channel.unsubscribe();
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();
        if (viewerPeerConnection.current) viewerPeerConnection.current.close();
    };
  }, [id, userProfile, arena, isBroadcaster, isStreamActive]);

  // Effect to attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    return () => {
        stopStream();
    };
  }, []);

  const loadArena = async (arenaId: string) => {
    try {
      const data = await arenaService.getArenaById(arenaId);
      setArena(data);
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
      setQuestions(data);
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
            if (prev.length === 0) return data;
            const lastId = prev[prev.length - 1].id;
            const newMsgs = data.filter((m: any) => m.id > lastId && !prev.find((p: any) => p.id === m.id));
            if (newMsgs.length === 0) return prev;
            // Simplified: just replace for now or merge logic
            return data; 
        });
      }
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const startStream = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        streamRef.current = stream;
        // Don't set srcObject here, wait for Green Room render
        setShowGreenRoom(true);
    } catch (err) {
        console.error("Error accessing media devices:", err);
        alert("Não foi possível acessar a câmera/microfone. Verifique as permissões.");
    }
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
        } catch (error) {
            console.error("Erro ao encerrar live:", error);
        }
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newQuestion.trim()) return;

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
        // Normal Question Flow
        await arenaService.sendQuestion(id, newQuestion, 'normal', 0);
        setNewQuestion('');
        loadQuestions(id); // Recarregar imediatamente
      }
    } catch (error) {
      console.error('Erro ao enviar pergunta:', error);
      alert('Erro ao enviar pergunta. Tente novamente.');
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

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main Content - Video */}
      <div className="flex-1 flex flex-col relative h-[60vh] md:h-auto">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button onClick={() => navigate('/arena')} className="bg-black/50 hover:bg-black/70 px-4 py-2 rounded text-sm backdrop-blur-sm">
                ← Voltar
            </button>
            {isBroadcaster && (
                <div className="bg-black/50 px-4 py-2 rounded text-sm backdrop-blur-sm flex items-center text-yellow-400 font-bold border border-yellow-500/30">
                    👑 Modo Transmissão
                </div>
            )}
        </div>
        
        {/* Video Area */}
        <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
          {isBroadcaster && (isStreamActive || showGreenRoom) ? (
            <div className="relative w-full h-full">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    muted // Muted locally to avoid feedback
                    playsInline
                    className={`w-full h-full object-cover ${!isCamOn ? 'hidden' : ''}`}
                />
                {!isCamOn && (
                   <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                       <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-600">
                           {userProfile?.avatar_url ? (
                               <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                           ) : (
                               <div className="w-full h-full bg-gray-600 flex items-center justify-center text-4xl">
                                   {userProfile?.full_name?.[0] || '?'}
                               </div>
                           )}
                       </div>
                   </div>
               )}
               
               {/* Green Room Overlay */}
               {showGreenRoom && (
                   <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                       <h2 className="text-2xl font-bold mb-6">Sala de Preparação</h2>
                       <div className="flex gap-4 mb-8">
                           <button 
                                onClick={toggleMic} 
                                className={`p-6 rounded-full transition-colors ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                           >
                                {isMicOn ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
                           </button>
                           <button 
                                onClick={toggleCam} 
                                className={`p-6 rounded-full transition-colors ${isCamOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                           >
                                {isCamOn ? <Video className="w-8 h-8" /> : <VideoOff className="w-8 h-8" />}
                           </button>
                       </div>
                       <div className="flex flex-col items-center gap-2">
                            <button 
                                onClick={joinRoom}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105"
                            >
                                Entrar na Sala
                            </button>
                            <p className="text-gray-400 text-sm mt-2">
                                {isCamOn ? 'Sua câmera está ligada' : 'Sua câmera está desligada (foto visível)'}
                            </p>
                       </div>
                   </div>
               )}
            </div>
          ) : (
             <div className="text-center w-full h-full relative">
                {remoteStream ? (
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline
                        className="w-full h-full object-contain bg-black"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4">
                        <div className="text-6xl mb-4 animate-pulse">🎥</div>
                        <h2 className="text-2xl font-bold mb-2">Transmissão da Arena</h2>
                        <p className="text-gray-400 mb-4">
                            {arena.status === 'live' ? 'AO VIVO - Conectando...' : 
                             arena.status === 'scheduled' ? `Inicia em ${new Date(arena.scheduled_at).toLocaleString()}` : 
                             'Transmissão Encerrada'}
                        </p>
                        {arena.status === 'live' && (
                            <button 
                                onClick={() => {
                                    if (signalingChannel.current) {
                                        signalingChannel.current.send({
                                            type: 'broadcast',
                                            event: 'viewer-join',
                                            payload: { viewerId: userProfile?.id }
                                        });
                                    }
                                }}
                                className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 text-sm"
                            >
                                Reconectar Vídeo
                            </button>
                        )}
                    </div>
                )}
                
                {isBroadcaster && !isStreamActive && arena.status !== 'ended' && (
                    <button 
                        onClick={startStream}
                        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold flex items-center transition-all hover:scale-105 z-50"
                    >
                        <Video className="w-5 h-5 mr-2" />
                        Ativar Câmera e Microfone
                    </button>
                )}
             </div>
          )}
          
          {/* Overlay Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-8">
            <h1 className="text-3xl font-bold">{arena.title}</h1>
            <div className="flex items-center mt-2">
                {arena.status === 'live' && (
                    <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold mr-2 animate-pulse">AO VIVO</span>
                )}
                <span className="text-lg">{arena.politicians?.name}</span>
            </div>
          </div>

          {/* Broadcaster Controls */}
          {isBroadcaster && isStreamActive && (
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-900/90 border border-gray-700 rounded-full px-6 py-3 flex items-center gap-4 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={toggleMic} className={`p-3 rounded-full ${isMicOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button onClick={toggleCam} className={`p-3 rounded-full ${isCamOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                
                <div className="w-px h-8 bg-gray-700 mx-2"></div>

                {arena.status === 'scheduled' && (
                    <button 
                        onClick={handleGoLive}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold flex items-center"
                    >
                        <Play className="w-4 h-4 mr-2" />
                        Entrar ao Vivo
                    </button>
                )}
                
                {arena.status === 'live' && (
                    <button 
                        onClick={handleEndLive}
                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full font-bold flex items-center"
                    >
                        <Square className="w-4 h-4 mr-2" />
                        Encerrar
                    </button>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Chat/Questions */}
      <div className="w-full md:w-96 h-[40vh] md:h-full bg-gray-800 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col z-20">
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
                        <div className="w-6 h-6 rounded-full bg-gray-500 mr-2 overflow-hidden">
                            {q.users?.avatar_url && <img src={q.users.avatar_url} alt="User" />}
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
                                    {msg.users?.avatar_url ? (
                                        <img src={msg.users.avatar_url} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs">
                                            {msg.users?.full_name?.[0] || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-baseline">
                                        <span className={`text-sm font-bold mr-2 ${msg.users?.role === 'politician' ? 'text-blue-400' : 'text-gray-300'}`}>
                                            {msg.users?.full_name || 'Usuário'}
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
                    <div className="mb-2 flex space-x-2 overflow-x-auto pb-2">
                        <button 
                            type="button"
                            onClick={() => setSuperChatAmount(0)}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${superChatAmount === 0 ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                        >
                            Normal
                        </button>
                        {arena.superchat_config?.levels?.map((level: any) => (
                            <button
                                key={level.amount}
                                type="button"
                                onClick={() => setSuperChatAmount(level.amount)}
                                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${superChatAmount === level.amount ? 'bg-yellow-600 text-black font-bold' : 'bg-gray-700 text-gray-400 border border-yellow-900'}`}
                            >
                                R$ {level.amount} - {level.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        placeholder={superChatAmount > 0 ? "Sua pergunta em destaque..." : "Faça uma pergunta ao convidado..."}
                        className={`w-full bg-gray-700 text-white rounded p-2 text-sm focus:outline-none focus:ring-2 ${superChatAmount > 0 ? 'focus:ring-yellow-500 border-yellow-600' : 'focus:ring-blue-500'}`}
                        rows={3}
                    />
                    <button 
                        type="submit"
                        className={`w-full mt-2 py-2 rounded font-bold transition-colors ${
                            superChatAmount > 0 
                            ? 'bg-yellow-600 hover:bg-yellow-500 text-black' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                    >
                        {superChatAmount > 0 ? `Enviar Super Chat (R$ ${superChatAmount})` : 'Enviar Pergunta'}
                    </button>
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
    </div>
  );
};


export default ArenaLive;
