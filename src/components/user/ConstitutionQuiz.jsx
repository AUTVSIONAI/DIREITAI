import React, { useState, useEffect } from 'react';
import { Trophy, Star, Clock, CheckCircle, XCircle, RotateCcw, Award, Target } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import GamificationService from '../../services/gamification';

const ConstitutionQuiz = () => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gamificationResult, setGamificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Perguntas do quiz da Constituição
  const questions = [
    {
      id: 1,
      question: "Qual é o primeiro artigo da Constituição Federal de 1988?",
      options: [
        "A República Federativa do Brasil é formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal",
        "Todo poder emana do povo, que o exerce por meio de representantes eleitos",
        "São direitos sociais a educação, a saúde, a alimentação, o trabalho",
        "É livre a manifestação do pensamento, sendo vedado o anonimato"
      ],
      correct: 0,
      explanation: "O Art. 1º estabelece que a República Federativa do Brasil é formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal, constituindo-se em Estado Democrático de Direito.",
      difficulty: "easy",
      points: 10
    },
    {
      id: 2,
      question: "Segundo a Constituição, todo poder emana de onde?",
      options: [
        "Do Estado",
        "Do povo",
        "Do governo",
        "Dos representantes eleitos"
      ],
      correct: 1,
      explanation: "Conforme o parágrafo único do Art. 1º, todo poder emana do povo, que o exerce por meio de representantes eleitos ou diretamente, nos termos desta Constituição.",
      difficulty: "easy",
      points: 10
    },
    {
      id: 3,
      question: "Qual dos seguintes NÃO é um direito fundamental previsto no Art. 5º?",
      options: [
        "Direito à vida",
        "Direito à liberdade",
        "Direito ao trabalho",
        "Direito à igualdade"
      ],
      correct: 2,
      explanation: "O direito ao trabalho está previsto no Art. 6º como direito social, não no Art. 5º que trata dos direitos e deveres individuais e coletivos.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 4,
      question: "Quantos anos de mandato tem um Presidente da República?",
      options: [
        "3 anos",
        "4 anos",
        "5 anos",
        "6 anos"
      ],
      correct: 1,
      explanation: "Segundo o Art. 82, o mandato do Presidente da República é de quatro anos, permitida uma reeleição para o período subsequente.",
      difficulty: "easy",
      points: 10
    },
    {
      id: 5,
      question: "Qual é a idade mínima para ser eleito Presidente da República?",
      options: [
        "30 anos",
        "35 anos",
        "40 anos",
        "45 anos"
      ],
      correct: 1,
      explanation: "Conforme o Art. 14, §3º, a idade mínima para concorrer ao cargo de Presidente da República é de 35 anos.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 6,
      question: "O que estabelece o princípio da presunção de inocência?",
      options: [
        "Ninguém pode ser preso sem ordem judicial",
        "Ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória",
        "Todos têm direito a um advogado",
        "É garantido o direito ao silêncio"
      ],
      correct: 1,
      explanation: "O Art. 5º, LVII estabelece que ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 7,
      question: "Qual poder é responsável por julgar o Presidente da República por crimes de responsabilidade?",
      options: [
        "Supremo Tribunal Federal",
        "Senado Federal",
        "Câmara dos Deputados",
        "Superior Tribunal de Justiça"
      ],
      correct: 1,
      explanation: "Segundo o Art. 52, I, compete privativamente ao Senado Federal processar e julgar o Presidente da República nos crimes de responsabilidade.",
      difficulty: "hard",
      points: 20
    },
    {
      id: 8,
      question: "Quantos Ministros compõem o Supremo Tribunal Federal?",
      options: [
        "9 Ministros",
        "11 Ministros",
        "13 Ministros",
        "15 Ministros"
      ],
      correct: 1,
      explanation: "Conforme o Art. 101, o Supremo Tribunal Federal compõe-se de onze Ministros, escolhidos dentre cidadãos com mais de 35 e menos de 65 anos de idade.",
      difficulty: "medium",
      points: 15
    },
    {
      id: 9,
      question: "O que são as cláusulas pétreas da Constituição?",
      options: [
        "Artigos que podem ser alterados apenas por emenda constitucional",
        "Dispositivos que não podem ser objeto de emenda tendente a aboli-los",
        "Normas que dependem de regulamentação",
        "Princípios fundamentais da República"
      ],
      correct: 1,
      explanation: "O Art. 60, §4º estabelece que não será objeto de deliberação a proposta de emenda tendente a abolir certas matérias (cláusulas pétreas).",
      difficulty: "hard",
      points: 20
    },
    {
      id: 10,
      question: "Qual é o prazo para propositura de Ação Direta de Inconstitucionalidade?",
      options: [
        "Não há prazo específico",
        "5 anos da promulgação da lei",
        "2 anos da promulgação da lei",
        "10 anos da promulgação da lei"
      ],
      correct: 0,
      explanation: "A Ação Direta de Inconstitucionalidade não possui prazo decadencial, podendo ser proposta a qualquer tempo após a promulgação da lei questionada.",
      difficulty: "hard",
      points: 20
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
    const points = isCorrect ? question.points + (streak * 2) : 0; // Bonus por streak
    
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

    // Próxima pergunta após 2 segundos
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(30);
      } else {
        finishQuiz();
      }
    }, 2000);
  };

  const finishQuiz = async () => {
    setQuizCompleted(true);
    
    // Salvar resultado no sistema de gamificação
    if (user) {
      setLoading(true);
      try {
        const correctAnswers = answers.filter(a => a.correct).length;
        const totalTimeSpent = answers.reduce((sum, a) => sum + a.timeSpent, 0);
        
        const result = await GamificationService.saveQuizResult(user.id, {
          quizType: 'constitution',
          score: score,
          totalQuestions: questions.length,
          correctAnswers,
          timeSpent: totalTimeSpent,
          answers: answers.map((answer, index) => ({
            questionId: questions[index].id.toString(),
            selectedAnswer: answer.selectedAnswer,
            isCorrect: answer.correct,
            timeSpent: answer.timeSpent
          }))
        });
        
        setGamificationResult(result);
      } catch (error) {
        console.error('Erro ao salvar resultado do quiz:', error);
      } finally {
        setLoading(false);
      }
    }
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

  const getScoreLevel = () => {
    const percentage = (score / (questions.reduce((sum, q) => sum + q.points, 0))) * 100;
    if (percentage >= 90) return { level: 'Constitucionalista Expert', color: 'text-yellow-600', icon: Trophy };
    if (percentage >= 80) return { level: 'Conhecedor Avançado', color: 'text-purple-600', icon: Award };
    if (percentage >= 70) return { level: 'Cidadão Informado', color: 'text-blue-600', icon: Target };
    if (percentage >= 60) return { level: 'Aprendiz Constitucional', color: 'text-green-600', icon: Star };
    return { level: 'Iniciante', color: 'text-gray-600', icon: Star };
  };

  if (!quizStarted) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz da Constituição Federal
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Teste seus conhecimentos sobre a Constituição Federal de 1988 e ganhe pontos!
            Responda rapidamente para ganhar bônus de streak.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">10 Perguntas</h3>
              <p className="text-sm text-gray-600">Questões sobre direitos, deveres e estrutura do Estado</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">30 Segundos</h3>
              <p className="text-sm text-gray-600">Por pergunta para responder</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Sistema de Pontos</h3>
              <p className="text-sm text-gray-600">Ganhe bônus por sequências corretas</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={startQuiz}
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Trophy className="w-5 h-5" />
              Iniciar Quiz
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
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4`}>
            <IconComponent className={`w-8 h-8 ${scoreLevel.color}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz Concluído!
          </h1>
          <p className={`text-xl font-semibold ${scoreLevel.color} mb-2`}>
            {scoreLevel.level}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {/* Resultados da Gamificação */}
          {gamificationResult && (
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-xl space-y-4 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <Award className="w-6 h-6" />
                <span className="text-lg font-semibold">Recompensas Obtidas</span>
              </div>
              
              <div className="text-2xl font-bold">+{gamificationResult.pointsEarned} pontos</div>
              
              {gamificationResult.levelUp && (
                <div className="bg-white/20 p-3 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Target className="w-5 h-5" />
                    <span className="font-semibold">Subiu de Nível!</span>
                  </div>
                  <div className="text-lg">Nível {gamificationResult.newLevel?.level}</div>
                </div>
              )}
              
              {gamificationResult.newAchievements?.length > 0 && (
                <div className="bg-white/20 p-3 rounded-lg">
                  <div className="font-semibold mb-2">Novas Conquistas:</div>
                  {gamificationResult.newAchievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span>{achievement.icon}</span>
                      <span>{achievement.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{score}</div>
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
                          +{userAnswer.points} pts
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <button
              onClick={resetQuiz}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header com progresso */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
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
              timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {question.difficulty === 'easy' ? 'Fácil' :
               question.difficulty === 'medium' ? 'Médio' : 'Difícil'}
            </span>
            <span className="text-sm text-gray-600">+{question.points} pontos</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {question.question}
          </h2>
        </div>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ";
            
            if (showResult) {
              if (index === question.correct) {
                buttonClass += "border-green-500 bg-green-50 text-green-800";
              } else if (index === selectedAnswer && index !== question.correct) {
                buttonClass += "border-red-500 bg-red-50 text-red-800";
              } else {
                buttonClass += "border-gray-200 bg-gray-50 text-gray-600";
              }
            } else {
              buttonClass += "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-900";
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && handleAnswer(index)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${
                    showResult && index === question.correct ? 'border-green-500 bg-green-500 text-white' :
                    showResult && index === selectedAnswer && index !== question.correct ? 'border-red-500 bg-red-500 text-white' :
                    'border-gray-300 text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
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

export default ConstitutionQuiz;