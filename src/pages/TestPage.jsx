import React from 'react'

const TestPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Página de Teste
        </h1>
        <p className="text-lg text-gray-600">
          Se você está vendo esta página, o React está funcionando corretamente.
        </p>
        <div className="mt-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Spinner de teste</p>
        </div>
      </div>
    </div>
  )
}

export default TestPage