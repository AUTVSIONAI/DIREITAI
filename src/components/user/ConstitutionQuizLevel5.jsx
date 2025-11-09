import React, { useState, useEffect } from 'react';
import { Trophy, Star, Clock, CheckCircle, XCircle, RotateCcw, Award, Target, ArrowLeft, Zap, Crown, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import GamificationService from '../../services/gamification';

const ConstitutionQuizLevel5 = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20); // Tempo extremamente limitado para nível master
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gamificationResult, setGamificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Perguntas do quiz da Constituição - Nível 5 (Master)
  const questions = [
    {
      id: 1,
      question: "Qual é o procedimento específico para a suspensão de direitos políticos por improbidade administrativa?",
      options: [
        "Decisão administrativa do TCU",
        "Sentença judicial transitada em julgado",
        "Processo administrativo disciplinar",
        "Decisão do Ministério Público"
      ],
      correct: 1,
      explanation: "O Art. 15, V c/c Art. 37, §4º estabelece que a suspensão dos direitos políticos por improbidade administrativa depende de sentença judicial transitada em julgado, conforme Lei 8.429/92.",
      difficulty: "master",
      points: 50
    },
    {
      id: 2,
      question: "Qual é a natureza jurídica da reclamação constitucional no STF?",
      options: [
        "Recurso extraordinário especial",
        "Ação autônoma de impugnação para preservar competência e autoridade das decisões",
        "Medida cautelar em ação direta",
        "Instrumento de controle concentrado"
      ],
      correct: 1,
      explanation: "A reclamação (Art. 102, I, 'l') é ação autônoma de impugnação destinada a preservar a competência do STF e garantir a autoridade de suas decisões, conforme jurisprudência consolidada.",
      difficulty: "master",
      points: 50
    },
    {
      id: 3,
      question: "Qual é o regime jurídico da responsabilidade por dano ao meio ambiente segundo a Constituição?",
      options: [
        "Responsabilidade civil subjetiva exclusiva",
        "Responsabilidade civil objetiva, penal e administrativa, independentes entre si",
        "Responsabilidade solidária entre pessoa física e jurídica",
        "Responsabilidade subsidiária do Estado"
      ],
      correct: 1,
      explanation: "O Art. 225, §3º estabelece que as condutas lesivas ao meio ambiente sujeitarão os infratores a sanções penais e administrativas, independentemente da obrigação de reparar os danos causados.",
      difficulty: "master",
      points: 50
    },
    {
      id: 4,
      question: "Qual é o procedimento para a criação de novos Estados por desmembramento?",
      options: [
        "Lei complementar federal após consulta às Assembleias Legislativas",
        "Emenda constitucional específica",
        "Lei complementar federal após aprovação por plebiscito das populações interessadas e das Assembleias Legislativas",
        "Decreto legislativo do Congresso Nacional"
      ],
      correct: 2,
      explanation: "O Art. 18, §3º estabelece que os Estados podem incorporar-se entre si, subdividir-se ou desmembrar-se mediante aprovação da população diretamente interessada, através de plebiscito, e do Congresso Nacional, por lei complementar.",
      difficulty: "master",
      points: 50
    },
    {
      id: 5,
      question: "Qual é a competência do STF para julgar conflitos federativos?",
      options: [
        "Apenas conflitos entre União e Estados",
        "Conflitos entre União, Estados, DF e Municípios",
        "Somente mediante ação direta de inconstitucionalidade",
        "Através de ação cível originária entre pessoas jurídicas de direito público"
      ],
      correct: 3,
      explanation: "O Art. 102, I, 'f' estabelece competência do STF para processar e julgar as causas e os conflitos entre a União e os Estados, a União e o DF, ou entre uns e outros, inclusive as respectivas entidades da administração indireta.",
      difficulty: "master",
      points: 50
    },
    {
      id: 6,
      question: "Qual é o regime de preclusão temporal para propositura de ação direta de inconstitucionalidade?",
      options: [
        "5 anos da publicação da lei",
        "2 anos da vigência da norma",
        "Não há prazo decadencial",
        "10 anos da promulgação"
      ],
      correct: 2,
      explanation: "Não existe prazo decadencial para propositura de ADI, pois o vício de inconstitucionalidade não se convalida com o tempo, conforme jurisprudência consolidada do STF.",
      difficulty: "master",
      points: 50
    },
    {
      id: 7,
      question: "Qual é a natureza da competência legislativa suplementar dos Estados?",
      options: [
        "Competência residual plena",
        "Competência para complementar princípios e normas gerais da União",
        "Competência concorrente limitada",
        "Competência delegada pela União"
      ],
      correct: 1,
      explanation: "O Art. 24, §2º estabelece que a competência da União para legislar sobre normas gerais não exclui a competência suplementar dos Estados, que podem complementar e detalhar as normas federais.",
      difficulty: "master",
      points: 50
    },
    {
      id: 8,
      question: "Qual é o procedimento para a intervenção federal nos Municípios?",
      options: [
        "Intervenção direta da União",
        "Intervenção do Estado, que pode ser determinada pela União",
        "Somente mediante decisão judicial",
        "Não é possível intervenção federal em Municípios"
      ],
      correct: 1,
      explanation: "O Art. 35 estabelece que o Estado não intervirá em seus Municípios, exceto quando a União intervir no Estado, ou para assegurar observância de princípios constitucionais.",
      difficulty: "master",
      points: 50
    },
    {
      id: 9,
      question: "Qual é o regime jurídico das fundações públicas segundo a Constituição?",
      options: [
        "Sempre de direito privado",
        "Sempre de direito público",
        "Podem ser de direito público ou privado, conforme sua finalidade",
        "A Constituição não disciplina as fundações públicas"
      ],
      correct: 2,
      explanation: "A Constituição permite a criação de fundações públicas tanto de direito público (autarquias fundacionais) quanto de direito privado, dependendo de sua finalidade e regime jurídico estabelecido em lei.",
      difficulty: "master",
      points: 50
    },
    {
      id: 10,
      question: "Qual é a competência do Conselho Nacional de Justiça para edição de atos normativos?",
      options: [
        "Competência regulamentar ampla",
        "Apenas atos de organização administrativa",
        "Competência normativa secundária para cumprimento de suas atribuições constitucionais",
        "Não possui competência normativa"
      ],
      correct: 2,
      explanation: "O CNJ possui competência normativa secundária, podendo editar resoluções para o cumprimento de suas atribuições constitucionais de controle administrativo e financeiro do Judiciário, conforme Art. 103-B.",
      difficulty: "master",
      points: 50
    },
    {
      id: 11,
      question: "Qual é o procedimento para a perda de mandato eletivo por quebra de decoro parlamentar no âmbito estadual?",
      options: [
        "Segue o mesmo procedimento federal",
        "Definido pela Constituição Estadual",
        "Decisão do Tribunal de Justiça",
        "Processo administrativo na Assembleia Legislativa"
      ],
      correct: 1,
      explanation: "O Art. 27, §1º estabelece que será de quatro anos o mandato dos Deputados Estaduais, aplicando-se-lhes as regras da CF sobre sistema eleitoral, inviolabilidade, imunidades, remuneração, perda de mandato, licença, impedimentos e incorporação às Forças Armadas.",
      difficulty: "master",
      points: 50
    },
    {
      id: 12,
      question: "Qual é a natureza jurídica do controle de constitucionalidade exercido pelos Tribunais de Contas?",
      options: [
        "Controle concentrado de constitucionalidade",
        "Controle difuso incidental no exercício de suas competências",
        "Controle administrativo de legalidade",
        "Não exercem controle de constitucionalidade"
      ],
      correct: 1,
      explanation: "Os Tribunais de Contas exercem controle difuso de constitucionalidade de forma incidental, podendo deixar de aplicar lei inconstitucional no caso concreto, conforme jurisprudência do STF.",
      difficulty: "master",
      points: 50
    },
    {
      id: 13,
      question: "Qual é o regime de imunidade tributária dos partidos políticos?",
      options: [
        "Imunidade ampla e irrestrita",
        "Imunidade limitada ao patrimônio, renda e serviços relacionados às finalidades essenciais",
        "Apenas isenção de impostos federais",
        "Não possuem imunidade tributária"
      ],
      correct: 1,
      explanation: "O Art. 150, VI, 'c' c/c §4º estabelece imunidade tributária para partidos políticos, limitada ao patrimônio, à renda e aos serviços relacionados com suas finalidades essenciais.",
      difficulty: "master",
      points: 50
    },
    {
      id: 14,
      question: "Qual é o procedimento para a aprovação de acordos internacionais que criem encargos ou compromissos gravosos ao patrimônio nacional?",
      options: [
        "Aprovação por decreto presidencial",
        "Referendo do Congresso Nacional por decreto legislativo",
        "Aprovação por lei ordinária",
        "Autorização prévia do Senado Federal"
      ],
      correct: 1,
      explanation: "O Art. 49, I estabelece competência exclusiva do Congresso Nacional para resolver definitivamente sobre tratados, acordos ou atos internacionais que acarretem encargos ou compromissos gravosos ao patrimônio nacional.",
      difficulty: "master",
      points: 50
    },
    {
      id: 15,
      question: "Qual é a competência do STF em sede de habeas corpus?",
      options: [
        "Competência originária e recursal ampla",
        "Apenas competência recursal",
        "Competência originária quando a autoridade coatora for tribunal superior ou autoridade com prerrogativa de foro",
        "Não julga habeas corpus"
      ],
      correct: 2,
      explanation: "O Art. 102, I, 'd' e 'i' estabelece competência originária do STF para HC quando o paciente for autoridade com prerrogativa de foro ou quando a coação provir de Tribunal Superior.",
      difficulty: "master",
      points: 50
    },
    {
      id: 16,
      question: "Qual é o regime de responsabilidade dos agentes políticos por crimes de responsabilidade?",
      options: [
        "Processo e julgamento pelo Poder Judiciário",
        "Processo político-administrativo pelo Poder Legislativo",
        "Processo misto: político-administrativo e judicial",
        "Processo administrativo pelos órgãos de controle"
      ],
      correct: 1,
      explanation: "Os crimes de responsabilidade são infrações político-administrativas julgadas pelo Poder Legislativo (impeachment), conforme Arts. 85 e 86 da CF e Lei 1.079/50.",
      difficulty: "master",
      points: 50
    },
    {
      id: 17,
      question: "Qual é a natureza da competência do STJ para uniformização da jurisprudência infraconstitucional?",
      options: [
        "Competência originária exclusiva",
        "Competência recursal para interpretação de lei federal",
        "Competência administrativa",
        "Competência consultiva"
      ],
      correct: 1,
      explanation: "O Art. 105, III estabelece competência do STJ para julgar recursos especiais, funcionando como tribunal de uniformização da jurisprudência infraconstitucional federal.",
      difficulty: "master",
      points: 50
    },
    {
      id: 18,
      question: "Qual é o procedimento para a criação de Municípios segundo a Constituição?",
      options: [
        "Lei estadual após consulta plebiscitária",
        "Lei complementar estadual dentro do período determinado por lei complementar federal",
        "Decreto do Governador",
        "Lei federal específica"
      ],
      correct: 1,
      explanation: "O Art. 18, §4º estabelece que a criação, incorporação, fusão e desmembramento de Municípios far-se-ão por lei estadual, dentro do período determinado por lei complementar federal, e dependerão de consulta prévia, mediante plebiscito, às populações dos Municípios envolvidos.",
      difficulty: "master",
      points: 50
    },
    {
      id: 19,
      question: "Qual é a competência legislativa privativa da União em matéria de seguridade social?",
      options: [
        "Competência plena e exclusiva",
        "Normas gerais, podendo os Estados legislar supletivamente",
        "Competência concorrente com Estados e Municípios",
        "Apenas previdência social dos servidores federais"
      ],
      correct: 0,
      explanation: "O Art. 22, XXIII estabelece competência privativa da União para legislar sobre seguridade social, sendo competência plena e exclusiva, não admitindo legislação estadual suplementar.",
      difficulty: "master",
      points: 50
    },
    {
      id: 20,
      question: "Qual é o regime jurídico da modulação temporal dos efeitos da declaração de inconstitucionalidade?",
      options: [
        "Sempre efeitos ex tunc (retroativos)",
        "Sempre efeitos ex nunc (prospectivos)",
        "Modulação excepcional por razões de segurança jurídica ou interesse social",
        "Definido caso a caso pelo relator"
      ],
      correct: 2,
      explanation: "O Art. 27 da Lei 9.868/99 permite ao STF, por maioria de 2/3, restringir os efeitos da declaração de inconstitucionalidade ou decidir que ela só tenha eficácia a partir de seu trânsito em julgado ou momento posterior, tendo em vista razões de segurança jurídica ou de excepcional interesse social.",
      difficulty: "master",
      points: 50
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
    setTimeLeft(20);
    setQuizCompleted(false);
    setShowResult(false);
  };

  const handleAnswer = (answerIndex) => {
    const question = questions[currentQuestion];
    const isCorrect = answerIndex === question.correct;
    const points = isCorrect ? question.points + (streak * 10) : 0; // Bonus supremo por streak no nível master
    
    const newAnswer = {
      questionId: question.id,
      selectedAnswer: answerIndex,
      correct: isCorrect,
      points: points,
      timeSpent: 20 - timeLeft
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

    // Próxima pergunta após 1.5 segundos (tempo mínimo absoluto no nível master)
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeLeft(20);
      } else {
        finishQuiz();
      }
    }, 1500);
  };

  const finishQuiz = async () => {
    setQuizCompleted(true);
    setLoading(true);

    try {
      const correctAnswers = answers.filter(a => a.correct).length;
      const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);

      const quizData = {
        quizType: 'constitution_level5',
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
      console.error('Erro ao registrar resultado do quiz nível 5:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = () => {
    const percentage = (score / (questions.length * 50)) * 100;
    if (percentage >= 98) return { level: 'Lenda Constitucional!', color: 'text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent', icon: Flame };
    if (percentage >= 95) return { level: 'Mestre Supremo!', color: 'text-yellow-600', icon: Crown };
    if (percentage >= 90) return { level: 'Mestre Constitucionalista!', color: 'text-purple-600', icon: Crown };
    if (percentage >= 85) return { level: 'Especialista Master!', color: 'text-indigo-600', icon: Zap };
    if (percentage >= 80) return { level: 'Excelente!', color: 'text-green-600', icon: Trophy };
    if (percentage >= 70) return { level: 'Muito Bom!', color: 'text-blue-600', icon: Star };
    return { level: 'Precisa Melhorar', color: 'text-red-600', icon: RotateCcw };
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setTimeLeft(20);
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600 rounded-full mb-4 animate-pulse">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz da Constituição - Nível 5
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            O desafio supremo! Apenas para verdadeiros mestres do Direito Constitucional.
            Questões de complexidade máxima com tempo extremamente limitado.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full mb-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">20 Perguntas</h3>
              <p className="text-sm text-gray-600">Questões master sobre aspectos mais complexos da Constituição</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mb-3">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">20 Segundos</h3>
              <p className="text-sm text-gray-600">Tempo extremo - apenas para experts!</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">50 Pontos Base</h3>
              <p className="text-sm text-gray-600">+ bônus supremo por sequências</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 via-pink-50 to-yellow-50 border-2 border-red-300 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Flame className="w-6 h-6 text-red-600 animate-pulse" />
              <span className="font-bold text-red-800 text-lg">Nível Master - Desafio Supremo</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              Este é o nível mais desafiador de todos! Contém questões sobre:
            </p>
            <ul className="text-sm text-red-700 list-disc list-inside space-y-1 mb-3">
              <li>Procedimentos constitucionais extremamente específicos</li>
              <li>Jurisprudência consolidada e leading cases do STF</li>
              <li>Aspectos técnicos e doutrinários de alta complexidade</li>
              <li>Competências específicas e regimes jurídicos especiais</li>
              <li>Interpretação constitucional avançada</li>
            </ul>
            <div className="bg-red-100 border border-red-300 rounded p-3">
              <p className="text-sm text-red-800 font-semibold">
                ⚠️ ATENÇÃO: Apenas 20 segundos por pergunta! Recomendado exclusivamente para:
              </p>
              <ul className="text-xs text-red-700 list-disc list-inside mt-1">
                <li>Professores de Direito Constitucional</li>
                <li>Magistrados e Membros do Ministério Público</li>
                <li>Advogados especialistas em Direito Público</li>
                <li>Estudantes de pós-graduação em Direito Constitucional</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={startQuiz}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 via-pink-600 to-yellow-600 text-white rounded-lg hover:from-red-700 hover:via-pink-700 hover:to-yellow-700 transition-all duration-200 font-bold shadow-lg transform hover:scale-105"
            >
              <Flame className="w-5 h-5" />
              Aceitar o Desafio Master
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
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600 rounded-full mb-4`}>
            <IconComponent className={`w-8 h-8 text-white`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quiz Master Concluído!
          </h1>
          <p className={`text-xl font-semibold ${scoreLevel.color} mb-2`}>
            {scoreLevel.level}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          {/* Resultados da Gamificação */}
          {gamificationResult && (
            <div className="bg-gradient-to-r from-red-600 via-pink-600 to-yellow-600 text-white p-6 rounded-xl space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <Award className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-bold">Parabéns! 🎉</h3>
                  <p className="text-red-100">Você completou o Quiz Master!</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">+{gamificationResult.pointsEarned}</div>
                  <div className="text-sm text-red-100">Pontos Ganhos</div>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{gamificationResult.newLevel}</div>
                  <div className="text-sm text-red-100">Nível Atual</div>
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
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-1">{score}</div>
              <div className="text-sm text-gray-600">Pontos Totais</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{correctAnswers}/{questions.length}</div>
              <div className="text-sm text-gray-600">Acertos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">{percentage}%</div>
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-semibold"
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
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-600">{streak}x streak</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <span className={`text-sm font-semibold ${
              timeLeft <= 5 ? 'text-red-600 animate-pulse text-lg' : 'text-gray-900'
            }`}>
              {timeLeft}s
            </span>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-red-600 via-pink-600 to-yellow-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Pergunta */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r from-red-100 via-pink-100 to-yellow-100 text-red-800">
              Master
            </span>
            <span className="text-sm text-gray-600">+{question.points} pontos</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {question.question}
          </h2>
        </div>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 hover:border-red-300 hover:bg-red-50";
            
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

export default ConstitutionQuizLevel5;