import React, { useState, useEffect } from 'react';
import { Trophy, Star, Clock, CheckCircle, XCircle, RotateCcw, Award, Target, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GamificationService from '../../services/gamification';

const ConstitutionQuizLevel2 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45); // Mais tempo para nível intermediário
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gamificationResult, setGamificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Perguntas do quiz da Constituição - Nível 2 (Intermediário)
  const questions = [
    {
      id: 1,
      question: "Qual é o prazo para o Presidente da República sancionar ou vetar um projeto de lei?",
      options: [
        "10 dias úteis",
        "15 dias úteis",
        "20 dias úteis",
        "30 dias corridos"
      ],
      correct: 1,
      explanation: "Segundo o Art. 84, o Presidente tem 15 dias úteis para sancionar ou vetar um projeto de lei aprovado pelo Congresso Nacional.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 2,
      question: "Quantos deputados federais cada estado pode ter no mínimo e no máximo?",
      options: [
        "Mínimo 6, máximo 60",
        "Mínimo 8, máximo 70",
        "Mínimo 10, máximo 80",
        "Mínimo 12, máximo 90"
      ],
      correct: 1,
      explanation: "Conforme o Art. 45, §1º, nenhum estado pode ter menos de 8 ou mais de 70 deputados federais.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 3,
      question: "Qual é o quórum mínimo para aprovação de uma emenda constitucional em cada casa do Congresso?",
      options: [
        "Maioria simples (50% + 1)",
        "Maioria absoluta (50% + 1 dos membros)",
        "2/3 dos membros",
        "3/5 dos membros"
      ],
      correct: 3,
      explanation: "O Art. 60, §2º estabelece que a emenda constitucional deve ser aprovada por 3/5 dos membros de cada Casa do Congresso Nacional, em dois turnos.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 4,
      question: "Qual é a competência exclusiva do Senado Federal em relação aos Ministros do STF?",
      options: [
        "Nomear os Ministros",
        "Aprovar a indicação dos Ministros",
        "Julgar os Ministros por crimes de responsabilidade",
        "Destituir os Ministros"
      ],
      correct: 1,
      explanation: "Segundo o Art. 52, III, 'a', compete privativamente ao Senado Federal aprovar previamente a escolha dos Ministros do STF.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 5,
      question: "O que caracteriza o estado de defesa segundo a Constituição?",
      options: [
        "Suspensão total dos direitos fundamentais",
        "Medida excepcional para preservar ou restabelecer a ordem pública",
        "Intervenção militar permanente",
        "Dissolução do Congresso Nacional"
      ],
      correct: 1,
      explanation: "O Art. 136 define o estado de defesa como medida excepcional para preservar ou prontamente restabelecer, em locais restritos, a ordem pública ou a paz social.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 6,
      question: "Qual é o prazo máximo para duração do estado de sítio?",
      options: [
        "15 dias",
        "30 dias",
        "60 dias",
        "90 dias"
      ],
      correct: 1,
      explanation: "Conforme o Art. 138, §1º, o estado de sítio não poderá ser decretado por mais de 30 dias, nem prorrogado por prazo superior.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 7,
      question: "Qual é a idade mínima para ser eleito Senador?",
      options: [
        "21 anos",
        "30 anos",
        "35 anos",
        "40 anos"
      ],
      correct: 1,
      explanation: "O Art. 14, §3º, VI, 'b' estabelece que a idade mínima para concorrer ao Senado Federal é de 35 anos.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 8,
      question: "O que são os direitos sociais segundo o Art. 6º da Constituição?",
      options: [
        "Direitos individuais básicos",
        "Direitos coletivos de participação política",
        "Direitos que garantem condições mínimas de vida digna",
        "Direitos de propriedade e livre iniciativa"
      ],
      correct: 2,
      explanation: "O Art. 6º estabelece os direitos sociais como educação, saúde, alimentação, trabalho, moradia, transporte, lazer, segurança, previdência social, proteção à maternidade e à infância, assistência aos desamparados.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 9,
      question: "Qual é o sistema de governo adotado pela Constituição de 1988?",
      options: [
        "Parlamentarismo",
        "Presidencialismo",
        "Sistema misto",
        "Monarquia constitucional"
      ],
      correct: 1,
      explanation: "A Constituição de 1988 adota o sistema presidencialista, onde o Presidente da República acumula as funções de Chefe de Estado e Chefe de Governo.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 10,
      question: "O que estabelece o princípio da anterioridade tributária?",
      options: [
        "Os tributos devem ser pagos antecipadamente",
        "É vedado cobrar tributos no mesmo exercício financeiro em que foi publicada a lei",
        "Os tributos devem ser aprovados pelo Congresso",
        "É proibido criar novos tributos"
      ],
      correct: 1,
      explanation: "O Art. 150, III, 'b' estabelece o princípio da anterioridade, vedando a cobrança de tributos no mesmo exercício financeiro em que foi publicada a lei que os instituiu ou aumentou.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 11,
      question: "Qual é a composição do Conselho Nacional de Justiça (CNJ)?",
      options: [
        "9 membros",
        "11 membros",
        "13 membros",
        "15 membros"
      ],
      correct: 3,
      explanation: "Segundo o Art. 103-B, o CNJ compõe-se de 15 membros com mandato de 2 anos, admitida uma recondução.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 12,
      question: "O que caracteriza a imunidade parlamentar material?",
      options: [
        "Deputados e senadores não podem ser presos",
        "Inviolabilidade por opiniões, palavras e votos no exercício do mandato",
        "Foro privilegiado para todos os crimes",
        "Impossibilidade de perder o mandato"
      ],
      correct: 1,
      explanation: "O Art. 53 estabelece que deputados e senadores são invioláveis, civil e penalmente, por suas opiniões, palavras e votos.",
      difficulty: "medium",
      points: 15
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
    setTimeLeft(45);
    setQuizCompleted(false);
    setShowResult(false);
  };

  const handleAnswer = (answerIndex) => {
    const question = questions[currentQuestion];
    const isCorrect = answerIndex === question.correct;
    const points = isCorrect ? question.points + (streak * 3) : 0; // Bonus maior por streak no nível 2
    
    const newAnswer = {
      questionId: question.id,
      selectedAnswer: answerIndex,
      correct: isCorrect,
      points: points,
      timeSpent: 45 - timeLeft
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

    // Próxima pergunta após 3 segundos (mais tempo para ler explicação)
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(45);
      } else {
        finishQuiz();
      }
    }, 3000);
  };

  const finishQuiz = async () => {
    setQuizCompleted(true);
    setLoading(true);

    try {
      // Calcular estatísticas
      const correctAnswers = answers.filter(a => a.correct).length;
      const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);

      // Montar payload de resultado
      const quizData = {
        quizType: 'constitution_level2',
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

      // Registrar resultado no sistema de gamificação
      const result = await GamificationService.saveQuizResult(user?.id, quizData);
      setGamificationResult(result);
    } catch (error) {
      console.error('Erro ao registrar resultado do quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = () => {
    const percentage = (score / (questions.length * 15)) * 100;
    if (percentage >= 90) return { level: 'Excelente!', color: 'text-green-600', icon: Trophy };
    if (percentage >= 80) return { level: 'Muito Bom!', color: 'text-blue-600', icon: Star };
    if (percentage >= 70) return { level: 'Bom!', color: 'text-yellow-600', icon: Target };
    if (percentage >= 60) return { level: 'Regular', color: 'text-orange-600', icon: Clock };
    return { level: 'Precisa Melhorar', color: 'text-red-600', icon: RotateCcw };
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setTimeLeft(45);
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz da Constituição - Nível 2
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Teste seus conhecimentos intermediários sobre a Constituição Federal de 1988!
            Perguntas mais complexas com mais tempo para responder.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">12 Perguntas</h3>
              <p className="text-sm text-gray-600">Questões intermediárias sobre estrutura e funcionamento do Estado</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">45 Segundos</h3>
              <p className="text-sm text-gray-600">Por pergunta para responder</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">15 Pontos Base</h3>
              <p className="text-sm text-gray-600">+ bônus por sequências corretas</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={startQuiz}
              className="inline-flex items-center gap-2 px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
            >
              <Trophy className="w-5 h-5" />
              Iniciar Quiz Nível 2
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
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4`}>
            <IconComponent className={`w-8 h-8 ${scoreLevel.color}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz Nível 2 Concluído!
          </h1>
          <p className={`text-xl font-semibold ${scoreLevel.color} mb-2`}>
            {scoreLevel.level}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {/* Resultados da Gamificação */}
          {gamificationResult && (
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-xl space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-bold">Parabéns! 🎉</h3>
                  <p className="text-orange-100">Você completou o Quiz Nível 2!</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">+{gamificationResult.pointsEarned}</div>
                  <div className="text-sm text-orange-100">Pontos Ganhos</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{gamificationResult.newLevel}</div>
                  <div className="text-sm text-orange-100">Nível Atual</div>
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
              <div className="text-3xl font-bold text-orange-600 mb-1">{score}</div>
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
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
                <Trophy className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-600">{streak}x streak</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <span className={`text-sm font-semibold ${
              timeLeft <= 15 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
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
               question.difficulty === 'medium' ? 'Intermediário' : 'Difícil'}
            </span>
            <span className="text-sm text-gray-600">+{question.points} pontos</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {question.question}
          </h2>
        </div>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 hover:border-orange-300 hover:bg-orange-50";
            
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

export default ConstitutionQuizLevel2;