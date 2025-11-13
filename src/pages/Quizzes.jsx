import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Unlock, Brain, Target, Flag, ArrowLeft } from 'lucide-react'
import { useGamification } from '../hooks/useGamification'
import GoalsService from '../services/goals'

const ProgressBar = ({ percentage }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className="bg-blue-600 h-2.5 rounded-full transition-all"
      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
    />
  </div>
)

const QuizCard = ({ title, description, to, locked, requirementLabel }) => (
  <div className="border rounded-lg p-4 bg-white shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <Brain className="h-5 w-5 text-primary-600" />
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="text-sm text-gray-600 mb-3">{description}</p>

    <div className="flex items-center justify-between">
      {locked ? (
        <span className="inline-flex items-center gap-1 text-red-600 text-sm">
          <Lock className="h-4 w-4" />
          {requirementLabel}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
          <Unlock className="h-4 w-4" />
          Liberado
        </span>
      )}

      {locked ? (
        <button className="px-3 py-2 text-sm bg-gray-200 text-gray-600 rounded cursor-not-allowed" disabled>
          Bloqueado
        </button>
      ) : (
        <Link to={to} className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
          Começar
        </Link>
      )}
    </div>
  </div>
)

export default function QuizzesPage() {
  const navigate = useNavigate()
  const { userGoals, loading } = useGamification()

  const progress = useMemo(() => {
    const goal = userGoals?.monthlyGoal
    if (!goal) return 0
    const current = goal.current_value || 0
    const target = goal.target_value || 1000
    return GoalsService.calculateProgress(current, target)
  }, [userGoals])

  const goalCompleted = useMemo(() => {
    const goal = userGoals?.monthlyGoal
    return goal ? GoalsService.isGoalCompleted(goal) : false
  }, [userGoals])

  const requirements = [
    { threshold: 0, label: 'Disponível para todos' },
    { threshold: 20, label: 'Requer 20% da meta mensal' },
    { threshold: 40, label: 'Requer 40% da meta mensal' },
    { threshold: 60, label: 'Requer 60% da meta mensal' },
    { threshold: 100, label: 'Requer concluir a meta mensal' }
  ]

  const quizzes = [
    {
      title: 'Constituição – Nível 1',
      description: 'Perguntas introdutórias sobre a Constituição.',
      to: '/quiz-constituicao',
      locked: false,
      requirementLabel: requirements[0].label
    },
    {
      title: 'Constituição – Nível 2',
      description: 'Questões intermediárias para aprofundar o conhecimento.',
      to: '/quiz-constituicao/level2',
      locked: progress < requirements[1].threshold,
      requirementLabel: requirements[1].label
    },
    {
      title: 'Constituição – Nível 3',
      description: 'Exercícios com maior complexidade e análise.',
      to: '/quiz-constituicao/level3',
      locked: progress < requirements[2].threshold,
      requirementLabel: requirements[2].label
    },
    {
      title: 'Constituição – Nível 4',
      description: 'Perguntas avançadas com interpretação de dispositivos.',
      to: '/quiz-constituicao/level4',
      locked: progress < requirements[3].threshold,
      requirementLabel: requirements[3].label
    },
    {
      title: 'Constituição – Nível 5',
      description: 'Desafio final para mestres da Constituição.',
      to: '/quiz-constituicao/level5',
      locked: !goalCompleted,
      requirementLabel: requirements[4].label
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <Flag className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold">Quizzes</h1>
        </div>

        <div className="mb-6 p-4 bg-white border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Progresso da meta mensal</span>
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <ProgressBar percentage={progress} />
          <p className="text-xs text-gray-500 mt-2">Complete metas para desbloquear novos níveis do quiz.</p>
        </div>

        {loading ? (
          <div className="p-6 bg-white border rounded-lg text-center text-gray-600">Carregando gamificação...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((q) => (
              <QuizCard
                key={q.to}
                title={q.title}
                description={q.description}
                to={q.to}
                locked={q.locked}
                requirementLabel={q.requirementLabel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}