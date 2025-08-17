import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Flag, 
  Shield, 
  Users, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  Calendar, 
  MessageSquare, 
  Award,
  Zap,
  Globe,
  Heart,
  BookOpen,
  UserCheck,
  Bot,
  BarChart3,
  TrendingUp,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

const HomePage = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'DireitaIA',
      description: 'IA especializada em política conservadora e direita brasileira'
    },
    {
      icon: BookOpen,
      title: 'Blog Patriota',
      description: 'Artigos e notícias sobre política conservadora e direita brasileira',
      link: '/blog'
    },
    {
      icon: UserCheck,
      title: 'Diretório de Políticos',
      description: 'Conheça os políticos conservadores e de direita do Brasil',
      link: '/politicos'
    },
    {
      icon: Bot,
      title: 'Agentes IA por Político',
      description: 'Converse com IAs que representam políticos conservadores',
      link: '/politicos'
    },
    {
      icon: BarChart3,
      title: 'Pesquisas DireitaJá',
      description: 'Participe de enquetes e pesquisas sobre temas nacionais',
      link: '/pesquisas'
    },
    {
      icon: TrendingUp,
      title: 'Resultados em Tempo Real',
      description: 'Veja os resultados das pesquisas e tendências políticas',
      link: '/resultados'
    },
    {
      icon: Calendar,
      title: 'Eventos Patriotas',
      description: 'Encontre e participe de eventos conservadores em todo o Brasil'
    },
    {
      icon: Users,
      title: 'Comunidade Ativa',
      description: 'Conecte-se com outros patriotas e conservadores'
    }
  ];

  const testimonials = [
    {
      name: 'Carlos Silva',
      role: 'Empresário',
      content: 'Finalmente uma plataforma que representa nossos valores conservadores!',
      rating: 5
    },
    {
      name: 'Maria Santos',
      role: 'Advogada',
      content: 'O DireitaIA me ajuda muito nas discussões políticas do dia a dia.',
      rating: 5
    },
    {
      name: 'João Oliveira',
      role: 'Professor',
      content: 'Excelente para encontrar eventos e se conectar com pessoas que pensam igual.',
      rating: 5
    }
  ];

  const stats = [
    { number: '10K+', label: 'Usuários Ativos' },
    { number: '500+', label: 'Eventos Realizados' },
    { number: '50K+', label: 'Conversas com IA' },
    { number: '95%', label: 'Satisfação' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-conservative-500 to-conservative-600 p-2 rounded-xl">
                <Flag className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent">
                Direitai.com
              </span>
            </div>
            <div className="flex items-center space-x-6">
              {/* Navigation Menu */}
              <nav className="hidden md:flex items-center space-x-1">
                <Link 
                  to="/blog" 
                  className="text-gray-700 hover:text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Blog</span>
                </Link>
                <Link 
                  to="/politicos" 
                  className="text-gray-700 hover:text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Políticos</span>
                </Link>
                <Link 
                  to="/pesquisas" 
                  className="text-gray-700 hover:text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Pesquisas</span>
                </Link>
                <Link 
                  to="/resultados" 
                  className="text-gray-700 hover:text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Resultados</span>
                </Link>
                <Link 
                  to="/verdade-ou-fake" 
                  className="text-gray-700 hover:text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200"
                >
                  <Shield className="h-4 w-4" />
                  <span>Verdade ou Fake</span>
                </Link>
              </nav>
              
              {/* Auth Buttons */}
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Entrar
                </Link>
                <Link 
                  to="/login" 
                  className="bg-gradient-to-r from-conservative-500 to-conservative-600 hover:from-conservative-600 hover:to-conservative-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Cadastrar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-conservative-500/20 text-conservative-300 text-sm font-medium mb-6 backdrop-blur-sm">
              <Flag className="h-4 w-4 mr-2" />
              Plataforma Oficial dos Patriotas Brasileiros
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              A Central do{' '}
              <span className="bg-gradient-to-r from-conservative-400 to-conservative-600 bg-clip-text text-transparent">
                Patriota
              </span>{' '}
              Brasileiro
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-200 mb-10 max-w-4xl mx-auto leading-relaxed">
              Conecte-se com outros conservadores, participe de eventos patrióticos e 
              converse com nossa IA especializada em política de direita.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/login" 
                className="group bg-gradient-to-r from-conservative-500 to-conservative-600 hover:from-conservative-600 hover:to-conservative-700 text-white px-10 py-4 rounded-xl text-lg font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span>Começar Agora</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="border-2 border-white/30 hover:border-white/50 text-white hover:bg-white/10 px-10 py-4 rounded-xl text-lg font-semibold backdrop-blur-sm transition-all duration-300">
                Saiba Mais
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-conservative-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-conservative-400/20 rounded-full blur-xl"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent mb-6">
              Recursos Exclusivos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ferramentas poderosas para fortalecer o movimento conservador brasileiro
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const gradients = [
                "from-blue-500 to-blue-600",
                "from-green-500 to-green-600", 
                "from-purple-500 to-purple-600",
                "from-orange-500 to-orange-600",
                "from-red-500 to-red-600",
                "from-indigo-500 to-indigo-600",
                "from-pink-500 to-pink-600",
                "from-teal-500 to-teal-600"
              ];
              const gradient = gradients[index % gradients.length];
              
              const FeatureCard = (
                <div className="group bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className={`bg-gradient-to-r ${gradient} text-white p-4 rounded-xl inline-block mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
              
              return feature.link ? (
                <Link key={index} to={feature.link} className="block">
                  {FeatureCard}
                </Link>
              ) : (
                <div key={index}>
                  {FeatureCard}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 to-conservative-50/30"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-700 to-primary-900 bg-clip-text text-transparent mb-6">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Depoimentos reais de patriotas que já fazem parte da nossa comunidade
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-conservative-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-8 italic text-lg leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-full p-3 mr-4">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 font-medium">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Junte-se ao movimento conservador brasileiro
            </h2>
            <p className="text-xl text-primary-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Faça parte da maior comunidade conservadora do Brasil. Cadastre-se agora e tenha acesso a todas as ferramentas exclusivas para fortalecer nossos valores.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                to="/login" 
                className="bg-white text-primary-700 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl shadow-lg"
              >
                Cadastrar Agora
              </Link>
              <Link 
                to="/blog" 
                className="border-2 border-white text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-primary-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
              >
                Conhecer Mais
              </Link>
            </div>
            <div className="mt-12 flex justify-center items-center space-x-8 text-primary-200">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">100% Seguro</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">+50.000 Membros</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-sm font-medium">Avaliação 4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-conservative-500 to-conservative-600 p-2 rounded-xl">
                  <Flag className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Direitai.com
                </span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed text-lg">
                A maior plataforma conservadora do Brasil. Conectando patriotas, defendendo valores e fortalecendo a democracia brasileira.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="bg-gray-800 hover:bg-conservative-600 p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="bg-gray-800 hover:bg-conservative-600 p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="bg-gray-800 hover:bg-conservative-600 p-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323C6.001 8.198 7.152 7.708 8.449 7.708s2.448.49 3.323 1.416c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.323c-.875.807-2.026 1.218-3.323 1.218zm7.718-1.297c-.875.875-2.026 1.365-3.323 1.365s-2.448-.49-3.323-1.365c-.875-.875-1.365-2.026-1.365-3.323s.49-2.448 1.365-3.323c.875-.875 2.026-1.365 3.323-1.365s2.448.49 3.323 1.365c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.323z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Navegação</h3>
              <ul className="space-y-3">
                <li><Link to="/blog" className="text-gray-300 hover:text-conservative-400 transition-colors duration-200 flex items-center space-x-2"><BookOpen className="h-4 w-4" /><span>Blog</span></Link></li>
                <li><Link to="/politicos" className="text-gray-300 hover:text-conservative-400 transition-colors duration-200 flex items-center space-x-2"><UserCheck className="h-4 w-4" /><span>Políticos</span></Link></li>
                <li><Link to="/pesquisas" className="text-gray-300 hover:text-conservative-400 transition-colors duration-200 flex items-center space-x-2"><BarChart3 className="h-4 w-4" /><span>Pesquisas</span></Link></li>
                <li><Link to="/verdade-ou-fake" className="text-gray-300 hover:text-conservative-400 transition-colors duration-200 flex items-center space-x-2"><Shield className="h-4 w-4" /><span>Verdade ou Fake</span></Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-6 text-white">Contato</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-conservative-400" />
                  <span>contato@direitai.com</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-conservative-400" />
                  <span>(11) 99999-9999</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-conservative-400" />
                  <span>São Paulo, SP</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-lg">
              &copy; 2024 <span className="text-conservative-400 font-semibold">Direitai.com</span>. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;