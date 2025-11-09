import React, { useState, useEffect } from 'react';
import { Trophy, Star, Clock, CheckCircle, XCircle, RotateCcw, Award, Target, ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GamificationService from '../../services/gamification';

const ConstitutionQuizLevel3 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // Menos tempo para nível avançado
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gamificationResult, setGamificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Perguntas do quiz da Constituição - Nível 3 (Avançado)
  const questions = [
    {
      id: 1,
      question: "Qual é o procedimento para a criação de uma CPI (Comissão Parlamentar de Inquérito)?",
      options: [
        "Requerimento de 1/4 dos membros da Casa",
        "Requerimento de 1/3 dos membros da Casa",
        "Requerimento de 1/2 dos membros da Casa",
        "Requerimento da maioria absoluta da Casa"
      ],
      correct: 1,
      explanation: "Conforme o Art. 58, §3º, as CPIs são criadas mediante requerimento de um terço (1/3) dos membros da Câmara dos Deputados ou do Senado Federal.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 2,
      question: "Qual é o prazo para o Supremo Tribunal Federal julgar a constitucionalidade de lei em controle concentrado?",
      options: [
        "30 dias",
        "60 dias",
        "90 dias",
        "Não há prazo específico na Constituição"
      ],
      correct: 3,
      explanation: "A Constituição não estabelece prazo específico para o STF julgar ADI, ADC ou ADPF. O prazo é regulamentado por lei infraconstitucional e regimento interno.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 3,
      question: "Em que hipóteses o Presidente da República pode decretar intervenção federal?",
      options: [
        "Apenas para manter a integridade nacional",
        "Somente quando solicitado pelos Poderes Legislativo ou Judiciário",
        "Nas hipóteses taxativas do Art. 34 da CF",
        "A qualquer momento, por decisão discricionária"
      ],
      correct: 2,
      explanation: "O Art. 34 da CF estabelece as hipóteses taxativas para intervenção federal, como manter a integridade nacional, repelir invasão estrangeira, pôr termo a grave comprometimento da ordem pública, entre outras.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 4,
      question: "Qual é o quórum para instalação e deliberação das comissões parlamentares?",
      options: [
        "Maioria absoluta para instalação e maioria simples para deliberação",
        "Maioria simples para ambas",
        "Maioria absoluta para ambas",
        "Definido pelo regimento interno de cada Casa"
      ],
      correct: 3,
      explanation: "O Art. 58, §2º, I estabelece que o quórum para instalação e funcionamento das comissões será definido no regimento interno de cada Casa do Congresso Nacional.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 5,
      question: "Qual é a natureza jurídica das medidas provisórias segundo a Constituição?",
      options: [
        "Atos administrativos com força de lei",
        "Leis em sentido formal e material",
        "Atos normativos primários com força de lei",
        "Decretos executivos especiais"
      ],
      correct: 2,
      explanation: "As medidas provisórias têm força de lei (Art. 62), sendo atos normativos primários que, uma vez aprovadas pelo Congresso, convertem-se em lei formal.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 6,
      question: "Qual é o procedimento para perda de mandato de deputado ou senador por quebra de decoro parlamentar?",
      options: [
        "Decisão da Mesa Diretora por maioria simples",
        "Decisão do Plenário por voto secreto e maioria absoluta",
        "Decisão da Comissão de Ética por maioria qualificada",
        "Decisão do STF em processo específico"
      ],
      correct: 1,
      explanation: "Conforme o Art. 55, §2º, a perda de mandato por quebra de decoro parlamentar será decidida pela Casa respectiva, por voto secreto e maioria absoluta.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 7,
      question: "Qual é a competência do Superior Tribunal de Justiça em relação à uniformização da jurisprudência?",
      options: [
        "Julgar recursos especiais para uniformizar a interpretação de lei federal",
        "Editar súmulas vinculantes",
        "Julgar conflitos de competência entre tribunais superiores",
        "Todas as alternativas estão corretas"
      ],
      correct: 0,
      explanation: "O Art. 105, III, 'a' e 'c' estabelece que compete ao STJ julgar recursos especiais para uniformizar a interpretação de lei federal em todo o território nacional.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 8,
      question: "Qual é o regime jurídico dos bens públicos segundo a Constituição?",
      options: [
        "Todos os bens públicos são inalienáveis",
        "Bens de uso comum são inalienáveis, os demais podem ser alienados",
        "A alienação depende de autorização legislativa específica",
        "A Constituição não trata especificamente dos bens públicos"
      ],
      correct: 3,
      explanation: "A Constituição não estabelece regime específico para bens públicos. Esta matéria é regulada por legislação infraconstitucional, principalmente o Código Civil.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 9,
      question: "Qual é o procedimento para aprovação de tratados internacionais que versem sobre direitos humanos?",
      options: [
        "Aprovação por maioria simples em cada Casa",
        "Aprovação por maioria absoluta em cada Casa",
        "Aprovação por 3/5 em cada Casa, em dois turnos (para equivaler à emenda)",
        "Aprovação apenas pelo Presidente da República"
      ],
      correct: 2,
      explanation: "O Art. 5º, §3º estabelece que tratados sobre direitos humanos aprovados por 3/5 dos membros de cada Casa, em dois turnos, equivalem às emendas constitucionais.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 10,
      question: "Qual é a competência legislativa concorrente entre União, Estados e DF?",
      options: [
        "União estabelece normas gerais, Estados suplementam",
        "Competência plena de todos os entes",
        "Apenas União e Estados, excluído o DF",
        "Somente em matéria tributária"
      ],
      correct: 0,
      explanation: "O Art. 24 estabelece a competência concorrente, onde a União limita-se a normas gerais (§1º) e Estados exercem competência suplementar (§2º).",
      difficulty: "hard",
      points: 25
    },
    {
      id: 11,
      question: "Qual é o prazo decadencial para propositura de ação rescisória no STF?",
      options: [
        "1 ano",
        "2 anos",
        "3 anos",
        "A Constituição não prevê ação rescisória no STF"
      ],
      correct: 3,
      explanation: "A Constituição não prevê ação rescisória de decisões do STF. O instituto existe apenas para decisões de tribunais inferiores, regulado por legislação processual.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 12,
      question: "Qual é o efeito da declaração de inconstitucionalidade em controle difuso pelo STF?",
      options: [
        "Efeito erga omnes imediato",
        "Efeito inter partes, podendo ter eficácia erga omnes via Senado",
        "Efeito ex nunc apenas",
        "Não produz efeitos vinculantes"
      ],
      correct: 1,
      explanation: "No controle difuso, a decisão tem efeito inter partes. O Art. 52, X permite ao Senado suspender a execução da lei declarada inconstitucional, dando eficácia erga omnes.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 13,
      question: "Qual é a natureza do mandado de injunção segundo a jurisprudência do STF?",
      options: [
        "Instrumento de controle concentrado de constitucionalidade",
        "Ação para suprir omissão legislativa que inviabilize direito constitucional",
        "Recurso contra decisões de tribunais inferiores",
        "Medida cautelar em ações constitucionais"
      ],
      correct: 1,
      explanation: "O Art. 5º, LXXI estabelece o mandado de injunção para casos de omissão de norma regulamentadora que torne inviável o exercício de direitos constitucionais.",
      difficulty: "hard",
      points: 25
    },
    {
      id: 14,
      question: "Qual é o regime de precatórios estabelecido pela Constituição?",
      options: [
        "Pagamento imediato de todas as dívidas judiciais",
        "Ordem cronológica de apresentação, com exceções constitucionais",
        "Discricionariedade do ente público para pagamento",
        "Pagamento apenas mediante autorização orçamentária específica"
      ],
      correct: 1,
      explanation: "O Art. 100 estabelece o regime de precatórios com ordem cronológica de apresentação, ressalvadas as exceções constitucionais (créditos alimentares, pequeno valor, etc.).",
      difficulty: "hard",
      points: 25
    },
    {
      id: 15,
      question: "Qual é a competência do Conselho Nacional do Ministério Público?",
      options: [
        "Apenas controle administrativo e financeiro",
        "Controle administrativo, financeiro e disciplinar",
        "Somente zelar pela autonomia funcional do MP",
        "Elaborar o estatuto do Ministério Público"
      ],
      correct: 1,
      explanation: "O Art. 130-A, §2º estabelece que compete ao CNMP o controle da atuação administrativa e financeira do MP e do cumprimento dos deveres funcionais de seus membros.",
      difficulty: "hard",
      points: 25
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
    setTimeLeft(30);
    setQuizCompleted(false);
    setShowResult(false);
  };

  const handleAnswer = (answerIndex) => {
    const question = questions[currentQuestion];
    const isCorrect = answerIndex === question.correct;
    const points = isCorrect ? question.points + (streak * 5) : 0; // Bonus ainda maior por streak no nível 3
    
    const newAnswer = {
      questionId: question.id,
      selectedAnswer: answerIndex,
      correct: isCorrect,
      points: points,
      timeSpent: 30 - timeLeft
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

    // Próxima pergunta após 2.5 segundos (menos tempo no nível avançado)
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(30);
      } else {
        finishQuiz();
      }
    }, 2500);
  };

  const finishQuiz = async () => {
    setQuizCompleted(true);
    setLoading(true);

    try {
      const correctAnswers = answers.filter(a => a.correct).length;
      const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);

      const quizData = {
        quizType: 'constitution_level3',
        score: score,
        totalQuestions: questions.length,
        correctAnswers,
        timeSpent: totalTime,
        answers: answers.map((a, index) => ({
          questionId: questions[index].id?.toString?.() || String(questions[index].id),
          selectedAnswer: a.selectedAnswer,
          isCorrect: a.correct,
          timeSpent: a.timeSpent
        }))
      };

      const result = await GamificationService.saveQuizResult(user?.id, quizData);
      setGamificationResult(result);
    } catch (error) {
      console.error('Erro ao registrar resultado do quiz nível 3:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = () => {
    const percentage = (score / (questions.length * 25)) * 100;
    if (percentage >= 90) return { level: 'Especialista!', color: 'text-purple-600', icon: Zap };
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
    setTimeLeft(30);
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz da Constituição - Nível 3
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Desafie-se com questões avançadas sobre a Constituição Federal!
            Para especialistas em Direito Constitucional.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">15 Perguntas</h3>
              <p className="text-sm text-gray-600">Questões avançadas sobre jurisprudência e procedimentos</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">30 Segundos</h3>
              <p className="text-sm text-gray-600">Por pergunta - tempo limitado!</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">25 Pontos Base</h3>
              <p className="text-sm text-gray-600">+ bônus elevado por sequências</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Nível Avançado</span>
            </div>
            <p className="text-sm text-red-700">
              Este quiz contém questões complexas sobre procedimentos constitucionais, 
              jurisprudência do STF e aspectos técnicos da Constituição. Recomendado para 
              estudantes avançados e profissionais do Direito.
            </p>
          </div>

          <div className="text-center">
            <button
              onClick={startQuiz}
              className="inline-flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              <Zap className="w-5 h-5" />
              Iniciar Quiz Nível 3
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
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4`}>
            <IconComponent className={`w-8 h-8 ${scoreLevel.color}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz Nível 3 Concluído!
          </h1>
          <p className={`text-xl font-semibold ${scoreLevel.color} mb-2`}>
            {scoreLevel.level}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {/* Resultados da Gamificação */}
          {gamificationResult && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-xl space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-bold">Parabéns! 🎉</h3>
                  <p className="text-purple-100">Você completou o Quiz Nível 3!</p>
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
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
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-600">{streak}x streak</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <span className={`text-sm font-semibold ${
              timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Pergunta */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              question.difficulty === 'medium' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {question.difficulty === 'easy' ? 'Fácil' :
               question.difficulty === 'medium' ? 'Intermediário' : 'Avançado'}
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

export default ConstitutionQuizLevel3;