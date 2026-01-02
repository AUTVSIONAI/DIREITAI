import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ title, description, image, url, type = 'website' }) => {
  const siteTitle = 'DireitAI - Central do Patriota';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const siteUrl = 'https://direitai.com';
  // Garante que a URL seja absoluta
  const fullUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : siteUrl;
  
  // Tratamento da imagem:
  // 1. Se fornecida e absoluta (http...), usa ela.
  // 2. Se fornecida e relativa (/...), adiciona o domínio.
  // 3. Se não fornecida, usa o logo padrão.
  const metaImage = image 
    ? (image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? image : '/' + image}`) 
    : `${siteUrl}/logo.png`;

  return (
    <Helmet>
      {/* Tags Padrão */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:image:secure_url" content={metaImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="DireitAI" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={metaImage} />
      
      {/* WhatsApp específico (às vezes usa itemprop) */}
      <meta itemprop="name" content={fullTitle} />
      <meta itemprop="description" content={description} />
      <meta itemprop="image" content={metaImage} />
    </Helmet>
  );
};

export default SEO;
