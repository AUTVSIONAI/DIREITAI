import React, { useState, useEffect } from 'react';
import { Trophy, Star, Clock, CheckCircle, XCircle, RotateCcw, Award, Target, ArrowLeft, Zap, Crown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import GamificationService from '../../services/gamification';

const ConstitutionQuizLevel4 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25); // Tempo ainda mais restrito para nível expert
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gamificationResult, setGamificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Perguntas do quiz da Constituição - Nível 4 (Expert)
  const questions = [
    {
      id: 1,
      question: "Qual é o procedimento específico para a criação de Territórios Federais segundo a Constituição?",
      options: [
        "Lei complementar federal",
        "Emenda constitucional",
        "Lei ordinária federal",
        "Decreto do Presidente da República"
      ],
      correct: 0,
      explanation: "O Art. 18, §2º estabelece que os Territórios Federais integram a União, e sua criação, transformação em Estado ou reintegração ao Estado de origem serão reguladas em lei complementar.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 2,
      question: "Qual é a natureza jurídica da arguição de descumprimento de preceito fundamental (ADPF)?",
      options: [
        "Ação de controle concentrado subsidiária",
        "Recurso constitucional",
        "Medida cautelar autônoma",
        "Ação de controle difuso"
      ],
      correct: 0,
      explanation: "A ADPF, prevista no Art. 102, §1º, é ação de controle concentrado de constitucionalidade de caráter subsidiário, cabível quando não houver outro meio eficaz de sanar a lesividade.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 3,
      question: "Qual é o regime jurídico das empresas públicas e sociedades de economia mista exploradoras de atividade econômica?",
      options: [
        "Regime jurídico de direito público",
        "Regime jurídico de direito privado, sujeitas ao regime jurídico próprio das empresas privadas",
        "Regime jurídico misto",
        "Regime jurídico administrativo especial"
      ],
      correct: 1,
      explanation: "O Art. 173, §1º, II estabelece que as empresas públicas e sociedades de economia mista exploradoras de atividade econômica sujeitam-se ao regime jurídico próprio das empresas privadas.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 4,
      question: "Qual é o procedimento para a declaração de guerra segundo a Constituição?",
      options: [
        "Decisão exclusiva do Presidente da República",
        "Autorização do Congresso Nacional ou referendo ad referendum em caso de agressão estrangeira",
        "Decisão do Conselho de Defesa Nacional",
        "Aprovação do Senado Federal por maioria qualificada"
      ],
      correct: 1,
      explanation: "O Art. 84, XIX c/c Art. 49, II estabelece que compete ao Presidente declarar guerra, no caso de agressão estrangeira, autorizado pelo Congresso Nacional ou referendado por ele, quando ocorrida no intervalo das sessões legislativas.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 5,
      question: "Qual é a competência do Tribunal de Contas da União em relação às contas do Presidente da República?",
      options: [
        "Julgar as contas",
        "Emitir parecer prévio",
        "Fiscalizar e auditar",
        "Aprovar ou rejeitar as contas"
      ],
      correct: 1,
      explanation: "O Art. 71, I estabelece que compete ao TCU apreciar as contas prestadas anualmente pelo Presidente da República, mediante parecer prévio que deverá ser elaborado em sessenta dias a contar de seu recebimento.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 6,
      question: "Qual é o regime de imunidade tributária das instituições de educação e de assistência social?",
      options: [
        "Imunidade ampla e irrestrita",
        "Imunidade condicionada ao cumprimento de requisitos legais",
        "Isenção tributária por prazo determinado",
        "Redução da base de cálculo tributária"
      ],
      correct: 1,
      explanation: "O Art. 150, VI, 'c' c/c §4º estabelece imunidade tributária para instituições de educação e assistência social sem fins lucrativos, condicionada ao atendimento dos requisitos da lei.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 7,
      question: "Qual é o procedimento para a perda da nacionalidade brasileira?",
      options: [
        "Decisão administrativa do Ministério da Justiça",
        "Sentença judicial transitada em julgado",
        "Processo administrativo com contraditório ou sentença judicial",
        "Decreto do Presidente da República"
      ],
      correct: 2,
      explanation: "O Art. 12, §4º estabelece que será declarada a perda da nacionalidade do brasileiro que adquirir outra nacionalidade, salvo exceções, mediante processo administrativo, assegurado o contraditório e a ampla defesa.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 8,
      question: "Qual é a natureza do controle de constitucionalidade exercido pelo STF em sede de recurso extraordinário?",
      options: [
        "Controle concentrado principal",
        "Controle difuso incidental",
        "Controle abstrato de normas",
        "Controle preventivo de constitucionalidade"
      ],
      correct: 1,
      explanation: "Em recurso extraordinário, o STF exerce controle difuso e incidental de constitucionalidade, analisando a questão constitucional como pressuposto para resolver o caso concreto.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 9,
      question: "Qual é o regime jurídico da responsabilidade civil do Estado por danos causados por seus agentes?",
      options: [
        "Responsabilidade subjetiva com culpa presumida",
        "Responsabilidade objetiva com direito de regresso",
        "Responsabilidade solidária entre Estado e agente",
        "Responsabilidade subsidiária do Estado"
      ],
      correct: 1,
      explanation: "O Art. 37, §6º estabelece responsabilidade objetiva do Estado por danos causados por seus agentes, com direito de regresso contra o agente responsável nos casos de dolo ou culpa.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 10,
      question: "Qual é o procedimento para a criação de regiões metropolitanas?",
      options: [
        "Lei federal específica",
        "Lei complementar estadual",
        "Convênio entre municípios",
        "Decreto estadual"
      ],
      correct: 1,
      explanation: "O Art. 25, §3º estabelece que os Estados poderão, mediante lei complementar, instituir regiões metropolitanas, aglomerações urbanas e microrregiões.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 11,
      question: "Qual é a competência do Superior Tribunal Militar?",
      options: [
        "Processar e julgar militares nos crimes militares definidos em lei",
        "Julgar habeas corpus em matéria criminal militar",
        "Processar e julgar nos crimes militares definidos em lei os militares da ativa e civis",
        "Todas as alternativas estão corretas"
      ],
      correct: 2,
      explanation: "O Art. 124 estabelece que à Justiça Militar compete processar e julgar os crimes militares definidos em lei, incluindo militares e civis em determinadas circunstâncias.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 12,
      question: "Qual é o regime de tramitação das medidas provisórias no Congresso Nacional?",
      options: [
        "Tramitação em regime de urgência com prazo de 60 dias prorrogáveis",
        "Tramitação ordinária sem prazo específico",
        "Tramitação em regime de urgência com prazo de 120 dias improrrogáveis",
        "Tramitação prioritária com prazo de 90 dias"
      ],
      correct: 0,
      explanation: "O Art. 62, §3º estabelece que as medidas provisórias terão sua votação iniciada na Câmara dos Deputados, com prazo de vigência de 60 dias, prorrogável uma vez por igual período.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 13,
      question: "Qual é a natureza jurídica do Conselho da República?",
      options: [
        "Órgão de consulta do Presidente da República",
        "Órgão deliberativo superior",
        "Tribunal constitucional",
        "Órgão de controle externo"
      ],
      correct: 0,
      explanation: "O Art. 89 define o Conselho da República como órgão superior de consulta do Presidente da República, manifestando-se sobre questões relevantes para a estabilidade das instituições democráticas.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 14,
      question: "Qual é o procedimento para a extradição de estrangeiros segundo a Constituição?",
      options: [
        "Decisão administrativa do Ministério da Justiça",
        "Processo judicial com decisão do STF",
        "Acordo diplomático bilateral",
        "Decreto presidencial fundamentado"
      ],
      correct: 1,
      explanation: "A extradição de estrangeiros é processada judicialmente, com competência do STF para decidir sobre sua concessão, conforme jurisprudência consolidada e legislação específica.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 15,
      question: "Qual é o regime jurídico das autarquias especiais (agências reguladoras)?",
      options: [
        "Regime jurídico de direito privado",
        "Regime jurídico de direito público com autonomia reforçada",
        "Regime jurídico misto público-privado",
        "Regime jurídico empresarial"
      ],
      correct: 1,
      explanation: "As autarquias especiais mantêm natureza de direito público, mas com autonomia administrativa, financeira e funcional reforçada, conforme legislação específica de cada setor regulado.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 16,
      question: "Qual é a competência legislativa privativa da União em matéria de direito processual?",
      options: [
        "Apenas direito processual civil",
        "Direito processual civil, penal e trabalhista",
        "Direito processual civil, comercial, penal, eleitoral, agrário, marítimo, aeronáutico, espacial e do trabalho",
        "Apenas direito processual penal e civil"
      ],
      correct: 2,
      explanation: "O Art. 22, I estabelece competência privativa da União para legislar sobre direito processual em todas suas modalidades: civil, comercial, penal, eleitoral, agrário, marítimo, aeronáutico, espacial e do trabalho.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 17,
      question: "Qual é o procedimento para a aprovação de empréstimos externos pelos entes federativos?",
      options: [
        "Autorização do Banco Central",
        "Autorização do Senado Federal",
        "Aprovação do Ministério da Fazenda",
        "Decisão autônoma de cada ente"
      ],
      correct: 1,
      explanation: "O Art. 52, V estabelece competência privativa do Senado Federal para autorizar operações externas de natureza financeira, de interesse da União, dos Estados, do DF, dos Territórios e dos Municípios.",
      difficulty: "expert",
      points: 35
    },
    {
      id: 18,
      question: "Qual é a natureza do processo legislativo das leis delegadas?",
      options: [
        "Processo legislativo ordinário",
        "Processo legislativo especial com delegação do Congresso ao Presidente",
        "Processo legislativo sumário",
        "Processo legislativo de urgência"
      ],
      correct: 1,
      explanation: "O Art. 68 estabelece que as leis delegadas são elaboradas pelo Presidente da República, que deverá solicitar a delegação ao Congresso Nacional, mediante resolução que especificará seu conteúdo e os termos de seu exercício.",
      difficulty: "expert",
      points: 35
    }
  ];

  // Timer do quiz
  useEffect(() => {
    let timer;
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0 && !showResult) {
      handleAnswer(null); // Resposta em branco por timeout
    }
    return () => clearTimeout(timer);
  }, [timeLeft, quizStarted, quizCompleted, showResult]);

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers([]);
    setStreak(0);
    setTimeLeft(25);
    setQuizCompleted(false);
    setShowResult(false);
  };

  const handleAnswer = (answerIndex) => {
    const question = questions[currentQuestion];
    const isCorrect = answerIndex === question.correct;
    const points = isCorrect ? question.points + (streak * 7) : 0; // Bonus máximo por streak no nível expert
    
    const newAnswer = {
      questionId: question.id,
      selectedAnswer: answerIndex,
      correct: isCorrect,
      points: points,
      timeSpent: 25 - timeLeft
    };

    setAnswers([...answers, newAnswer]);
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (isCorrect) {
      setScore(score + points);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) {
        setBestStreak(streak + 1);
      }
    } else {
      setStreak(0);
    }

    // Próxima pergunta após 2 segundos (tempo mínimo no nível expert)
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(25);
      } else {
        finishQuiz();
      }
    }, 2000);
  };

  const finishQuiz = async () => {
    setQuizCompleted(true);
    setLoading(true);

    try {
      // Calcular estatísticas
      const correctAnswers = answers.filter(a => a.correct).length;
      const accuracy = (correctAnswers / questions.length) * 100;
      const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);
      const avgTimePerQuestion = totalTime / questions.length;

      // Registrar resultado no sistema de gamificação
      const result = await GamificationService.completeQuiz({
        userId: user?.id,
        quizType: 'constitution_level4',
        score: score,
        accuracy: accuracy,
        timeSpent: totalTime,
        streak: bestStreak,
        level: 4
      });

      setGamificationResult(result);
    } catch (error) {
      console.error('Erro ao registrar resultado do quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = () => {
    const percentage = (score / (questions.length * 35)) * 100;
    if (percentage >= 95) return { level: 'Mestre Constitucionalista!', color: 'text-purple-600', icon: Crown };
    if (percentage >= 90) return { level: 'Especialista Expert!', color: 'text-indigo-600', icon: Zap };
    if (percentage >= 80) return { level: 'Excelente!', color: 'text-green-600', icon: Trophy };
    if (percentage >= 70) return { level: 'Muito Bom!', color: 'text-blue-600', icon: Star };
    if (percentage >= 60) return { level: 'Bom!', color: 'text-yellow-600', icon: Target };
    return { level: 'Precisa Melhorar', color: 'text-red-600', icon: RotateCcw };
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setTimeLeft(25);
    setQuizCompleted(false);
    setAnswers([]);
    setShowResult(false);
    setStreak(0);
    setGamificationResult(null);
    setLoading(false);
  };

  const question = questions[currentQuestion];

  if (!quizStarted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Botão de voltar */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz da Constituição - Nível 4
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            O desafio supremo! Questões de altíssima complexidade para verdadeiros experts em Direito Constitucional.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">18 Perguntas</h3>
              <p className="text-sm text-gray-600">Questões expert sobre procedimentos e jurisprudência avançada</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mb-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">25 Segundos</h3>
              <p className="text-sm text-gray-600">Tempo extremamente limitado!</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mb-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">35 Pontos Base</h3>
              <p className="text-sm text-gray-600">+ bônus máximo por sequências</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Nível Expert - Máxima Dificuldade</span>
            </div>
            <p className="text-sm text-red-700 mb-2">
              Este é o nível mais desafiador! Contém questões sobre:
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
              <li>Procedimentos constitucionais complexos</li>
              <li>Jurisprudência consolidada do STF</li>
              <li>Aspectos técnicos e doutrinários avançados</li>
              <li>Competências específicas e regimes jurídicos especiais</li>
            </ul>
            <p className="text-sm text-red-700 mt-2 font-semibold">
              Recomendado apenas para especialistas, professores e operadores experientes do Direito.
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={startQuiz}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
            >
              <Crown className="w-5 h-5" />
              Aceitar o Desafio Expert
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const scoreLevel = getScoreLevel();
    const IconComponent = scoreLevel.icon;
    const correctAnswers = answers.filter(a => a.correct).length;
    const totalPossiblePoints = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / totalPossiblePoints) * 100);

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4`}>
            <IconComponent className={`w-8 h-8 text-white`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz Expert Concluído!
          </h1>
          <p className={`text-xl font-semibold ${scoreLevel.color} mb-2`}>
            {scoreLevel.level}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {/* Resultados da Gamificação */}
          {gamificationResult && (
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-xl space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-bold">Parabéns! 🎉</h3>
                  <p className="text-purple-100">Você completou o Quiz Expert!</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">+{gamificationResult.pointsEarned}</div>
                  <div className="text-sm text-purple-100">Pontos Ganhos</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{gamificationResult.newLevel}</div>
                  <div className="text-sm text-purple-100">Nível Atual</div>
                </div>
              </div>
              
              {gamificationResult.achievements && gamificationResult.achievements.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">🏆 Conquistas Desbloqueadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {gamificationResult.achievements.map((achievement, index) => (
                      <span key={index} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                        {achievement.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{score}</div>
              <div className="text-sm text-gray-600">Pontos Totais</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{correctAnswers}/{questions.length}</div>
              <div className="text-sm text-gray-600">Acertos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{percentage}%</div>
              <div className="text-sm text-gray-600">Aproveitamento</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">{bestStreak}</div>
              <div className="text-sm text-gray-600">Melhor Sequência</div>
            </div>
          </div>

          {/* Classificação baseada na performance */}
          {(() => {
            const accuracy = GamificationService.calculateAccuracy(
              correctAnswers,
              questions.length
            );
            const classification = GamificationService.getScoreClassification(accuracy);
            
            return (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-2xl">{classification.icon}</span>
                  <span className={`font-semibold ${classification.color}`}>
                    {classification.title}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-700">{accuracy}% de acertos</div>
              </div>
            );
          })()}

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revisão das Respostas</h3>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const userAnswer = answers[index];
                return (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {userAnswer.correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Sua resposta:</strong> {userAnswer.selectedAnswer !== null ? question.options[userAnswer.selectedAnswer] : 'Não respondida'}
                        </p>
                        {!userAnswer.correct && (
                          <p className="text-sm text-green-600 mb-2">
                            <strong>Resposta correta:</strong> {question.options[question.correct]}
                          </p>
                        )}
                        <p className="text-sm text-blue-600">
                          <strong>Explicação:</strong> {question.explanation}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          userAnswer.correct ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {userAnswer.correct ? `+${userAnswer.points}` : '0'} pts
                        </div>
                        <div className="text-xs text-gray-500">
                          {userAnswer.timeSpent}s
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={resetQuiz}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold"
            >
              <RotateCcw className="w-5 h-5" />
              Tentar Novamente
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header com informações do quiz */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-600">
              Pergunta {currentQuestion + 1} de {questions.length}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-900">{score} pontos</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-600">{streak}x streak</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <span className={`text-sm font-semibold ${
              timeLeft <= 8 ? 'text-red-600 animate-pulse' : 'text-gray-900'
            }`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Pergunta */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800">
              Expert
            </span>
            <span className="text-sm text-gray-600">+{question.points} pontos</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {question.question}
          </h2>
        </div>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 hover:border-purple-300 hover:bg-purple-50";
            
            if (showResult) {
              if (index === question.correct) {
                buttonClass += " border-green-500 bg-green-50 text-green-800";
              } else if (index === selectedAnswer && index !== question.correct) {
                buttonClass += " border-red-500 bg-red-50 text-red-800";
              } else {
                buttonClass += " border-gray-200 bg-gray-50 text-gray-500";
              }
            } else {
              buttonClass += " border-gray-200 bg-white text-gray-900";
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && handleAnswer(index)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span className="flex-1">{option}</span>
                  {showResult && index === question.correct && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showResult && index === selectedAnswer && index !== question.correct && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Explicação:</strong> {question.explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstitutionQuizLevel4;