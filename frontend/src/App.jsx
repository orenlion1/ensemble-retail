import { useEffect, useMemo, useState } from 'react';
import { faro } from '@grafana/faro-react';
import { loadCategories, loadProducts, saveAccount, saveCart } from './api.js';

const emptyAccount = {
  id: 'demo-shopper',
  name: 'Demo Shopper',
  email: 'shopper@ensemble-retail.test',
  shippingAddress: {
    line1: '120 Summit Way',
    city: 'Denver',
    region: 'CO',
    postalCode: '80202',
    country: 'US'
  },
  wallet: {
    label: 'Visa ending 4242',
    billingPostalCode: '80202'
  }
};

const regions = [
  { code: 'US', label: 'US', flag: '🇺🇸', locale: 'en-US', language: 'American English', copyKey: 'en' },
  { code: 'CA', label: 'Canada', flag: '🇨🇦', locale: 'fr-CA', language: 'French', copyKey: 'fr' },
  { code: 'CN', label: 'China', flag: '🇨🇳', locale: 'zh-CN', language: 'Mandarin', copyKey: 'zh' },
  { code: 'UK', label: 'UK', flag: '🇬🇧', locale: 'en-GB', language: 'British English', copyKey: 'enGB' },
  { code: 'SE', label: 'Sweden', flag: '🇸🇪', locale: 'sv-SE', language: 'Swedish', copyKey: 'sv' }
];

const grafanaStackUrl = 'https://orenlion.grafana.net/a/grafana-kowalski-app/apps/464/actions?var-Filters=';

function regionConfigFor(code) {
  return regions.find(item => item.code === code) || regions[0];
}

const copy = {
  en: {
    brandFamilyLabel: 'Ensemble collections',
    springSale: 'Spring Collection Sale',
    freeShipping: 'Free shipping',
    findStore: 'Find a store',
    regionSelector: 'Region selector',
    help: 'Help',
    shop: 'Shop',
    cart: 'Cart',
    account: 'Account',
    heroEyebrow: 'Technical apparel for city-to-summit days',
    heroTitle: 'Layered systems for weather, motion, and everyday altitude.',
    heroCta: 'Shop new arrivals',
    categories: 'Categories',
    categoryTitle: 'Built for changing conditions',
    searchPlaceholder: 'Search gear',
    sortProducts: 'Sort products',
    sortFeatured: 'Featured',
    sortPriceLow: 'Price low to high',
    sortPriceHigh: 'Price high to low',
    sortRating: 'Top rated',
    topLevelCategories: 'Top level categories',
    mens: "Men's",
    womens: "Women's",
    add: 'Add',
    viewProduct: name => `View ${name}`,
    off: 'off',
    shopAll: 'Shop all',
    saleTitle: '15% off selected systems',
    close: 'Close',
    productDescription: 'Weather-aware construction, clean silhouettes, and enough technical detail for repeat wear in real conditions.',
    sizes: 'Sizes',
    colors: 'Colors',
    addSelectedDefault: 'Add selected default',
    shoppingCart: 'Shopping cart',
    cartTitle: 'Ready when the route changes',
    emptyCart: 'Your cart is empty.',
    quantityFor: name => `Quantity for ${name}`,
    removeFromCart: name => `Remove ${name} from cart`,
    originalSubtotal: 'Original subtotal',
    saleDiscount: percent => `Spring sale discount (${percent}% off)`,
    subtotal: 'Subtotal',
    mockCheckout: 'Mock checkout',
    checkoutDialogTitle: 'Grafana trace ready',
    checkoutConfirmed: 'Mock checkout confirmed. Trace this order in Grafana.',
    accountTitle: 'Shipping and wallet',
    name: 'Name',
    email: 'Email',
    address: 'Address',
    city: 'City',
    wallet: 'Wallet',
    saveAccount: 'Save account',
    signInWithGoogle: 'Sign in with Google',
    signOut: 'Sign out',
    signedInAs: email => `Signed in as ${email}`,
    signInUnavailable: 'Google sign-in is not configured.',
    walletError: 'Wallet can store payment metadata only.',
    all: 'All'
  },
  fr: {
    brandFamilyLabel: 'Collections Ensemble',
    springSale: 'Soldes de la collection du printemps',
    freeShipping: 'Livraison gratuite',
    findStore: 'Trouver une boutique',
    regionSelector: 'Sélecteur de région',
    help: 'Aide',
    shop: 'Magasiner',
    cart: 'Panier',
    account: 'Compte',
    heroEyebrow: 'Vêtements techniques pour les journées ville-sommet',
    heroTitle: 'Des systèmes de couches pour la météo, le mouvement et l’altitude du quotidien.',
    heroCta: 'Voir les nouveautés',
    categories: 'Catégories',
    categoryTitle: 'Conçu pour les conditions changeantes',
    searchPlaceholder: 'Rechercher de l’équipement',
    sortProducts: 'Trier les produits',
    sortFeatured: 'En vedette',
    sortPriceLow: 'Prix croissant',
    sortPriceHigh: 'Prix décroissant',
    sortRating: 'Les mieux notés',
    topLevelCategories: 'Catégories principales',
    mens: 'Hommes',
    womens: 'Femmes',
    add: 'Ajouter',
    viewProduct: name => `Voir ${name}`,
    off: 'de rabais',
    shopAll: 'Tout magasiner',
    saleTitle: '15 % de rabais sur certains systèmes',
    close: 'Fermer',
    productDescription: 'Construction adaptée aux intempéries, silhouettes nettes et détails techniques pensés pour un usage répété en conditions réelles.',
    sizes: 'Tailles',
    colors: 'Couleurs',
    addSelectedDefault: 'Ajouter la sélection par défaut',
    shoppingCart: 'Panier',
    cartTitle: 'Prêt quand l’itinéraire change',
    emptyCart: 'Votre panier est vide.',
    quantityFor: name => `Quantité pour ${name}`,
    removeFromCart: name => `Retirer ${name} du panier`,
    originalSubtotal: 'Sous-total initial',
    saleDiscount: percent => `Rabais des soldes du printemps (${percent} % de rabais)`,
    subtotal: 'Sous-total',
    mockCheckout: 'Simuler le paiement',
    checkoutDialogTitle: 'Trace Grafana prête',
    checkoutConfirmed: 'Paiement simulé confirmé. Suivez cette commande dans Grafana.',
    accountTitle: 'Livraison et portefeuille',
    name: 'Nom',
    email: 'Courriel',
    address: 'Adresse',
    city: 'Ville',
    wallet: 'Portefeuille',
    saveAccount: 'Enregistrer le compte',
    signInWithGoogle: 'Se connecter avec Google',
    signOut: 'Se déconnecter',
    signedInAs: email => `Connecté en tant que ${email}`,
    signInUnavailable: 'La connexion Google n’est pas configurée.',
    walletError: 'Le portefeuille peut stocker uniquement les métadonnées de paiement.',
    all: 'Tout'
  },
  enGB: {
    brandFamilyLabel: 'Ensemble collections',
    springSale: 'Spring Collection Sale',
    freeShipping: 'Free delivery',
    findStore: 'Find a store',
    regionSelector: 'Region selector',
    help: 'Help',
    shop: 'Shop',
    cart: 'Basket',
    account: 'Account',
    heroEyebrow: 'Technical apparel for city-to-summit days',
    heroTitle: 'Layering systems for weather, movement, and everyday altitude.',
    heroCta: 'Shop new arrivals',
    categories: 'Categories',
    categoryTitle: 'Built for changeable conditions',
    searchPlaceholder: 'Search kit',
    sortProducts: 'Sort products',
    sortFeatured: 'Featured',
    sortPriceLow: 'Price low to high',
    sortPriceHigh: 'Price high to low',
    sortRating: 'Top rated',
    topLevelCategories: 'Top level categories',
    mens: "Men's",
    womens: "Women's",
    add: 'Add',
    viewProduct: name => `View ${name}`,
    off: 'off',
    shopAll: 'Shop all',
    saleTitle: '15% off selected systems',
    close: 'Close',
    productDescription: 'Weather-aware construction, clean silhouettes, and enough technical detail for repeated wear in real conditions.',
    sizes: 'Sizes',
    colors: 'Colours',
    addSelectedDefault: 'Add selected default',
    shoppingCart: 'Basket',
    cartTitle: 'Ready when the route changes',
    emptyCart: 'Your basket is empty.',
    quantityFor: name => `Quantity for ${name}`,
    removeFromCart: name => `Remove ${name} from basket`,
    originalSubtotal: 'Original subtotal',
    saleDiscount: percent => `Spring sale discount (${percent}% off)`,
    subtotal: 'Subtotal',
    mockCheckout: 'Mock checkout',
    checkoutDialogTitle: 'Grafana trace ready',
    checkoutConfirmed: 'Mock checkout confirmed. Trace this order in Grafana.',
    accountTitle: 'Delivery and wallet',
    name: 'Name',
    email: 'Email',
    address: 'Address',
    city: 'Town or city',
    wallet: 'Wallet',
    saveAccount: 'Save account',
    signInWithGoogle: 'Sign in with Google',
    signOut: 'Sign out',
    signedInAs: email => `Signed in as ${email}`,
    signInUnavailable: 'Google sign-in is not configured.',
    walletError: 'Wallet can store payment metadata only.',
    all: 'All'
  },
  zh: {
    brandFamilyLabel: 'Ensemble 系列',
    springSale: '春季系列特卖',
    freeShipping: '免运费',
    findStore: '查找门店',
    regionSelector: '地区选择器',
    help: '帮助',
    shop: '购物',
    cart: '购物车',
    account: '账户',
    heroEyebrow: '适合城市到山顶行程的技术服装',
    heroTitle: '为天气、运动和日常海拔变化打造的叠穿系统。',
    heroCta: '选购新品',
    categories: '类别',
    categoryTitle: '为多变环境而生',
    searchPlaceholder: '搜索装备',
    sortProducts: '商品排序',
    sortFeatured: '精选',
    sortPriceLow: '价格从低到高',
    sortPriceHigh: '价格从高到低',
    sortRating: '评分最高',
    topLevelCategories: '顶级类别',
    mens: '男士',
    womens: '女士',
    add: '加入',
    viewProduct: name => `查看${name}`,
    off: '折扣',
    shopAll: '查看全部',
    saleTitle: '精选系统享 15% 优惠',
    close: '关闭',
    productDescription: '应对天气的结构、简洁轮廓，以及适合真实环境反复穿着的技术细节。',
    sizes: '尺码',
    colors: '颜色',
    addSelectedDefault: '加入默认选择',
    shoppingCart: '购物车',
    cartTitle: '路线变化时也准备就绪',
    emptyCart: '您的购物车为空。',
    quantityFor: name => `${name}数量`,
    removeFromCart: name => `从购物车移除${name}`,
    originalSubtotal: '原价小计',
    saleDiscount: percent => `春季特卖折扣（${percent}% 优惠）`,
    subtotal: '小计',
    mockCheckout: '模拟结账',
    checkoutDialogTitle: 'Grafana 追踪已就绪',
    checkoutConfirmed: '模拟结账已确认。请在 Grafana 中追踪此订单。',
    accountTitle: '配送和钱包',
    name: '姓名',
    email: '电子邮件',
    address: '地址',
    city: '城市',
    wallet: '钱包',
    saveAccount: '保存账户',
    signInWithGoogle: '使用 Google 登录',
    signOut: '退出登录',
    signedInAs: email => `已登录为 ${email}`,
    signInUnavailable: 'Google 登录未配置。',
    walletError: '钱包只能存储支付元数据。',
    all: '全部'
  },
  sv: {
    brandFamilyLabel: 'Ensemble-kollektioner',
    springSale: 'Vårkollektionsrea',
    freeShipping: 'Fri frakt',
    findStore: 'Hitta en butik',
    regionSelector: 'Regionväljare',
    help: 'Hjälp',
    shop: 'Handla',
    cart: 'Varukorg',
    account: 'Konto',
    heroEyebrow: 'Tekniska kläder för dagar från stad till topp',
    heroTitle: 'Lagersystem för väder, rörelse och vardagens höjdskillnader.',
    heroCta: 'Handla nyheter',
    categories: 'Kategorier',
    categoryTitle: 'Byggt för skiftande förhållanden',
    searchPlaceholder: 'Sök utrustning',
    sortProducts: 'Sortera produkter',
    sortFeatured: 'Utvalt',
    sortPriceLow: 'Pris lågt till högt',
    sortPriceHigh: 'Pris högt till lågt',
    sortRating: 'Högst betyg',
    topLevelCategories: 'Huvudkategorier',
    mens: 'Herr',
    womens: 'Dam',
    add: 'Lägg till',
    viewProduct: name => `Visa ${name}`,
    off: 'rabatt',
    shopAll: 'Handla allt',
    saleTitle: '15 % rabatt på utvalda system',
    close: 'Stäng',
    productDescription: 'Vädermedveten konstruktion, rena silhuetter och tekniska detaljer för återkommande användning i verkliga förhållanden.',
    sizes: 'Storlekar',
    colors: 'Färger',
    addSelectedDefault: 'Lägg till valt standardval',
    shoppingCart: 'Varukorg',
    cartTitle: 'Redo när rutten ändras',
    emptyCart: 'Din varukorg är tom.',
    quantityFor: name => `Antal för ${name}`,
    removeFromCart: name => `Ta bort ${name} från varukorgen`,
    originalSubtotal: 'Ursprunglig delsumma',
    saleDiscount: percent => `Vårrea (${percent} % rabatt)`,
    subtotal: 'Delsumma',
    mockCheckout: 'Simulerad kassa',
    checkoutDialogTitle: 'Grafana-spårning klar',
    checkoutConfirmed: 'Simulerad kassa bekräftad. Spåra denna order i Grafana.',
    accountTitle: 'Leverans och plånbok',
    name: 'Namn',
    email: 'E-post',
    address: 'Adress',
    city: 'Stad',
    wallet: 'Plånbok',
    saveAccount: 'Spara konto',
    signInWithGoogle: 'Logga in med Google',
    signOut: 'Logga ut',
    signedInAs: email => `Inloggad som ${email}`,
    signInUnavailable: 'Google-inloggning är inte konfigurerad.',
    walletError: 'Plånboken kan bara lagra betalningsmetadata.',
    all: 'Alla'
  }
};

const localizedCatalog = {
  enGB: {
    categories: {
      Pants: 'Trousers'
    },
    products: {
      'mens-trail-pant': "Men's Traverse Trail Trousers",
      'womens-climb-pant': "Women's Climbing Trousers"
    }
  },
  fr: {
    categories: {
      All: 'Tout',
      Shells: 'Coquilles',
      'Mid Layers': 'Couches intermédiaires',
      Pants: 'Pantalons',
      Packs: 'Sacs',
      'Base Layers': 'Couches de base',
      Accessories: 'Accessoires'
    },
    colors: {
      Graphite: 'Graphite',
      Lichen: 'Lichen',
      'Signal Red': 'Rouge signal',
      Pine: 'Pin',
      Black: 'Noir',
      Ice: 'Glace',
      Basalt: 'Basalte',
      Moss: 'Mousse',
      Cobalt: 'Cobalt',
      Clay: 'Argile',
      Heather: 'Bruyère',
      Night: 'Nuit',
      Sage: 'Sauge',
      Mineral: 'Minéral',
      Juniper: 'Genévrier',
      Olive: 'Olive'
    },
    badges: {
      'Storm ready': 'Prêt pour la tempête',
      '15% off': '15 % de rabais',
      'Online exclusive': 'Exclusivité en ligne',
      'Warmth without bulk': 'Chaleur sans volume',
      'Articulated fit': 'Coupe articulée'
    },
    products: {
      'mens-shell-alpha': 'Veste coquille alpine homme',
      'mens-midlayer-grid': 'Couche intermédiaire en molleton quadrillé homme',
      'mens-trail-pant': 'Pantalon de sentier Traverse homme',
      'mens-daypack-22': 'Sac Route 22 homme',
      'womens-base-merino': 'Chandail de base en mérinos femme',
      'womens-softshell-hoody': 'Manteau souple à capuchon femme',
      'womens-climb-pant': 'Pantalon d’escalade femme',
      'womens-rain-cap': 'Casquette Rainline femme'
    }
  },
  zh: {
    categories: {
      All: '全部',
      Shells: '硬壳',
      'Mid Layers': '中间层',
      Pants: '裤装',
      Packs: '背包',
      'Base Layers': '基础层',
      Accessories: '配件'
    },
    colors: {
      Graphite: '石墨色',
      Lichen: '地衣色',
      'Signal Red': '信号红',
      Pine: '松绿色',
      Black: '黑色',
      Ice: '冰蓝色',
      Basalt: '玄武岩色',
      Moss: '苔藓绿',
      Cobalt: '钴蓝色',
      Clay: '陶土色',
      Heather: '灰紫色',
      Night: '夜色',
      Sage: '鼠尾草色',
      Mineral: '矿物色',
      Juniper: '杜松绿',
      Olive: '橄榄色'
    },
    badges: {
      'Storm ready': '风暴就绪',
      '15% off': '15% 优惠',
      'Online exclusive': '线上专属',
      'Warmth without bulk': '轻量保暖',
      'Articulated fit': '活动剪裁'
    },
    products: {
      'mens-shell-alpha': '男士高山硬壳夹克',
      'mens-midlayer-grid': '男士网格抓绒中间层',
      'mens-trail-pant': '男士 Traverse 徒步裤',
      'mens-daypack-22': '男士 Route 22 背包',
      'womens-base-merino': '女士美利奴基础层上衣',
      'womens-softshell-hoody': '女士软壳连帽夹克',
      'womens-climb-pant': '女士攀岩裤',
      'womens-rain-cap': '女士 Rainline 帽'
    }
  },
  sv: {
    categories: {
      All: 'Alla',
      Shells: 'Skaljackor',
      'Mid Layers': 'Mellanlager',
      Pants: 'Byxor',
      Packs: 'Ryggsäckar',
      'Base Layers': 'Baslager',
      Accessories: 'Accessoarer'
    },
    colors: {
      Graphite: 'Grafit',
      Lichen: 'Lav',
      'Signal Red': 'Signalröd',
      Pine: 'Tallgrön',
      Black: 'Svart',
      Ice: 'Isblå',
      Basalt: 'Basalt',
      Moss: 'Mossa',
      Cobalt: 'Kobolt',
      Clay: 'Lera',
      Heather: 'Ljung',
      Night: 'Natt',
      Sage: 'Salvia',
      Mineral: 'Mineral',
      Juniper: 'En',
      Olive: 'Oliv'
    },
    badges: {
      'Storm ready': 'Redo för storm',
      '15% off': '15 % rabatt',
      'Online exclusive': 'Endast online',
      'Warmth without bulk': 'Värme utan volym',
      'Articulated fit': 'Ledad passform'
    },
    products: {
      'mens-shell-alpha': 'Alpin skaljacka herr',
      'mens-midlayer-grid': 'Grid-fleece mellanlager herr',
      'mens-trail-pant': 'Traverse vandringsbyxa herr',
      'mens-daypack-22': 'Route 22 ryggsäck herr',
      'womens-base-merino': 'Merino baslager dam',
      'womens-softshell-hoody': 'Softshell-hoodie dam',
      'womens-climb-pant': 'Klätterbyxa dam',
      'womens-rain-cap': 'Rainline keps dam'
    }
  }
};

function discountPercent(product) {
  if (!product.originalPrice) return null;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

function localizeUkRetailTerms(value) {
  return String(value || '')
    .replace(/\bPants\b/g, 'Trousers')
    .replace(/\bPant\b/g, 'Trouser');
}

function GrafanaLogoMark() {
  return (
    <svg className="grafanaLogo" viewBox="0 0 96 96" role="img" aria-label="Grafana logo">
      <circle cx="48" cy="48" r="42" fill="#f46800" />
      <path fill="#fff" d="M48 18c-6 0-11 2-16 5l5 9c3-2 7-3 11-3 12 0 22 10 22 22 0 10-7 19-17 21v-9c5-2 9-7 9-13 0-8-6-14-14-14s-14 6-14 14c0 2 .4 4 1.3 6l-8 4A23 23 0 0 1 25 50c0-13 10-24 23-24 2 0 4 .3 6 .8l2-9A32 32 0 0 0 48 18Z" />
      <path fill="#fff" d="M42 50a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z" />
      <path fill="#111412" fillOpacity=".16" d="M48 6a42 42 0 1 1 0 84 42 42 0 0 0 0-84Z" />
    </svg>
  );
}

function CheckoutTraceCopy({ copyText, onGrafanaClick }) {
  const grafanaLabel = 'Grafana';
  const grafanaIndex = copyText.indexOf(grafanaLabel);

  if (grafanaIndex === -1) {
    return <>{copyText}</>;
  }

  return (
    <>
      {copyText.slice(0, grafanaIndex)}
      <a
        href={grafanaStackUrl}
        target="_blank"
        rel="noreferrer"
        onClick={onGrafanaClick}
        data-faro-user-action-name="navigate-checkout:grafana"
      >
        {grafanaLabel}
      </a>
      {copyText.slice(grafanaIndex + grafanaLabel.length)}
    </>
  );
}

function readStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

const authStorageKey = 'ensemble-auth-session';
const authVerifierKey = 'ensemble-auth-code-verifier';
const authStateKey = 'ensemble-auth-state';
const cognitoHostedUiDomain = (import.meta.env.VITE_COGNITO_HOSTED_UI_DOMAIN || 'https://ensemble-grafana.auth.us-east-1.amazoncognito.com').replace(/\/$/, '');
const cognitoClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '7a4vi9r6gjqjjoughnrq21l07t';
const cognitoRedirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`;
const authConfigured = Boolean(cognitoHostedUiDomain && cognitoClientId && cognitoRedirectUri);

function readStoredAuthSession() {
  const session = readStoredJson(authStorageKey, null);
  if (!session?.accessToken || !session?.user?.id) return null;
  if (session.expiresAt && session.expiresAt <= Date.now()) {
    localStorage.removeItem(authStorageKey);
    return null;
  }
  return session;
}

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeJwtPayload(token) {
  const payload = token?.split('.')[1];
  if (!payload) return {};
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
  try {
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return {};
  }
}

function randomToken(bytes = 32) {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return base64UrlEncode(values);
}

async function sha256Base64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return base64UrlEncode(digest);
}

async function beginGoogleLogin() {
  const codeVerifier = randomToken(64);
  const state = randomToken(24);
  localStorage.setItem(authVerifierKey, codeVerifier);
  localStorage.setItem(authStateKey, state);
  const params = new URLSearchParams({
    client_id: cognitoClientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: cognitoRedirectUri,
    identity_provider: 'Google',
    state,
    code_challenge_method: 'S256',
    code_challenge: await sha256Base64Url(codeVerifier)
  });
  window.location.assign(`${cognitoHostedUiDomain}/oauth2/authorize?${params.toString()}`);
}

async function completeGoogleLoginFromCallback() {
  const search = new URLSearchParams(window.location.search);
  const code = search.get('code');
  if (!code || window.location.pathname !== '/auth/callback') return null;
  const expectedState = localStorage.getItem(authStateKey);
  if (!expectedState || search.get('state') !== expectedState) {
    throw new Error('Invalid OAuth state');
  }
  const codeVerifier = localStorage.getItem(authVerifierKey);
  if (!codeVerifier) {
    throw new Error('Missing OAuth verifier');
  }
  const response = await fetch(`${cognitoHostedUiDomain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: cognitoClientId,
      code,
      redirect_uri: cognitoRedirectUri,
      code_verifier: codeVerifier
    })
  });
  if (!response.ok) {
    throw new Error(`Cognito token exchange failed: ${response.status}`);
  }
  const tokens = await response.json();
  const claims = decodeJwtPayload(tokens.id_token);
  const user = {
    id: claims.sub || claims.username || claims.email?.toLowerCase(),
    email: claims.email || '',
    name: claims.name || claims.given_name || claims.email || 'Google Shopper'
  };
  const session = {
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    expiresAt: Date.now() + Number(tokens.expires_in || 3600) * 1000,
    user
  };
  localStorage.setItem(authStorageKey, JSON.stringify(session));
  localStorage.removeItem(authVerifierKey);
  localStorage.removeItem(authStateKey);
  window.history.replaceState({}, '', `${window.location.origin}/#account`);
  return session;
}

function getFaroUser(account) {
  const email = account?.email?.trim();
  if (!email) return null;
  return {
    id: account.id || email.toLowerCase(),
    email,
    username: account.name
  };
}

function faroActionName(action, value) {
  if (!value) return action;
  return `${action}:${String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

function trackFaroAction(name, attributes = {}, options = {}) {
  const stringAttributes = Object.fromEntries(
    Object.entries(attributes)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  );

  let action = faro.api.getActiveUserAction?.();
  if (action && action.name !== name) {
    action.end?.();
    action = undefined;
  }

  action = action || faro.api.startUserAction?.(name, stringAttributes, {
    triggerName: options.triggerName || 'click',
    importance: options.importance
  });

  faro.api.pushEvent?.('ensemble.user.action', {
    userActionName: name,
    ...stringAttributes
  }, undefined, {
    skipDedupe: true
  });

  window.setTimeout(() => {
    action?.end?.();
  }, 0);
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [activeDepartment, setActiveDepartment] = useState('mens');
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [region, setRegion] = useState(() => {
    const urlRegion = new URLSearchParams(window.location.search).get('region');
    const storedRegion = localStorage.getItem('ensemble-region');
    return regionConfigFor(urlRegion || storedRegion).code;
  });
  const [cart, setCart] = useState(() => readStoredJson('ensemble-cart', []));
  const [account, setAccount] = useState(() => readStoredJson('ensemble-account', emptyAccount));
  const [authSession, setAuthSession] = useState(readStoredAuthSession);
  const [authError, setAuthError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
  const selectedRegion = regionConfigFor(region);
  const locale = selectedRegion.copyKey;
  const t = copy[locale];

  function localizeCategory(category) {
    const localized = localizedCatalog[locale]?.categories?.[category] || category;
    return locale === 'enGB' ? localizeUkRetailTerms(localized) : localized;
  }

  function localizeColor(color) {
    return localizedCatalog[locale]?.colors?.[color] || color;
  }

  function localizeBadge(badge) {
    return localizedCatalog[locale]?.badges?.[badge] || badge;
  }

  function localizeProductName(product) {
    const localized = localizedCatalog[locale]?.products?.[product.id] || product.name;
    return locale === 'enGB' ? localizeUkRetailTerms(localized) : localized;
  }

  function departmentLabel(department) {
    return department === 'mens' ? t.mens : t.womens;
  }

  function trackAppAction(name, attributes = {}, options = {}) {
    trackFaroAction(name, {
      region,
      regionLabel: selectedRegion.label,
      locale: selectedRegion.locale,
      language: selectedRegion.language,
      ...attributes
    }, options);
  }

  useEffect(() => {
    loadProducts().then(setProducts);
    loadCategories().then(setCategoryGroups);
  }, []);

  const departmentCategories = useMemo(() => {
    const group = categoryGroups.find(item => item.department === activeDepartment);
    return ['All', ...(group?.categories || [])];
  }, [activeDepartment, categoryGroups]);

  useEffect(() => {
    saveCart(cart, authSession);
  }, [authSession, cart]);

  useEffect(() => {
    localStorage.setItem('ensemble-region', region);
  }, [region]);

  useEffect(() => {
    document.documentElement.lang = selectedRegion.locale;
  }, [selectedRegion.locale]);

  useEffect(() => {
    const faroUser = getFaroUser(account);
    if (faroUser) {
      faro.api.setUser(faroUser);
    }
  }, [account.email, account.id, account.name]);

  useEffect(() => {
    completeGoogleLoginFromCallback()
      .then(session => {
        if (!session) return;
        setAuthSession(session);
        setAccount(current => ({
          ...current,
          id: session.user.id || current.id,
          name: session.user.name || current.name,
          email: session.user.email || current.email
        }));
        trackAppAction('auth:google-login-complete', {
          accountEmail: session.user.email
        });
      })
      .catch(error => {
        setAuthError(error.message);
        trackAppAction('auth:google-login-error', {
          error: error.message
        });
        window.history.replaceState({}, '', `${window.location.origin}/#account`);
      });
  }, []);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesDepartment = product.department === activeDepartment;
      const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
      const searchableText = [
        product.name,
        localizeProductName(product),
        product.category,
        localizeCategory(product.category),
        product.department,
        departmentLabel(product.department),
        product.colors.join(' '),
        product.colors.map(localizeColor).join(' '),
        product.badge,
        localizeBadge(product.badge)
      ].join(' ');
      const matchesQuery = searchableText.toLowerCase().includes(query.toLowerCase());
      return matchesDepartment && matchesCategory && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      return b.stock - a.stock;
    });
  }, [activeCategory, activeDepartment, locale, products, query, sort]);

  const enrichedCart = useMemo(() => cart.map(item => {
    const product = products.find(candidate => candidate.id === item.productId);
    if (!product) return item;
    return {
      ...item,
      originalPrice: item.originalPrice || product.originalPrice,
      price: product.price,
      displayName: localizeProductName(product),
      displayColor: localizeColor(item.color),
      displayCategory: localizeCategory(product.category)
    };
  }), [cart, locale, products]);
  const subtotal = enrichedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const originalSubtotal = enrichedCart.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  const discountTotal = originalSubtotal - subtotal;
  const checkoutDiscountPercent = originalSubtotal > 0 && discountTotal > 0
    ? Math.round((discountTotal / originalSubtotal) * 100)
    : 0;
  const saleProducts = useMemo(() => products.filter(product => product.originalPrice), [products]);

  function addToCart(product, options = {}) {
    const size = options.size || product.sizes[0];
    const color = options.color || product.colors[0];
    const actionName = options.actionName || faroActionName('shopping-cart:add-item', product.id);
    trackAppAction(actionName, {
      productId: product.id,
      productName: product.name,
      category: product.category,
      department: product.department,
      source: options.source || 'product-grid'
    });
    const key = `${product.id}-${size}-${color}`;
    setCart(current => {
      const found = current.find(item => item.key === key);
      if (found) {
        return current.map(item => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { key, productId: product.id, name: product.name, originalPrice: product.originalPrice, price: product.price, size, color, image: product.image, quantity: 1 }];
    });
  }

  function changeRegion(nextRegion) {
    const nextRegionConfig = regionConfigFor(nextRegion);
    trackAppAction(faroActionName('select-region', nextRegion), {
      region: nextRegion,
      regionLabel: nextRegionConfig.label,
      locale: nextRegionConfig.locale,
      language: nextRegionConfig.language
    }, {
      triggerName: 'change'
    });
    trackAppAction(faroActionName('select-language', nextRegionConfig.language), {
      region: nextRegion,
      regionLabel: nextRegionConfig.label,
      locale: nextRegionConfig.locale,
      language: nextRegionConfig.language
    }, {
      triggerName: 'change'
    });
    setRegion(nextRegion);
  }

  function selectDepartment(department) {
    trackAppAction(faroActionName('select-department', department), {
      department
    });
    setActiveDepartment(department);
    setActiveCategory('All');
  }

  function selectCategory(category) {
    trackAppAction(faroActionName('select-category', `${activeDepartment}-${category}`), {
      department: activeDepartment,
      category
    });
    setActiveCategory(category);
  }

  function viewProduct(product, source) {
    trackAppAction(faroActionName('view-product', `${source}-${product.id}`), {
      productId: product.id,
      productName: product.name,
      category: product.category,
      department: product.department,
      source
    });
    setSelectedProduct(product);
  }

  function closeProductDetail() {
    trackAppAction(faroActionName('close-product-detail', selectedProduct?.id), {
      productId: selectedProduct?.id,
      productName: selectedProduct?.name
    });
    setSelectedProduct(null);
  }

  function mockCheckout() {
    trackAppAction('shopping-cart:checkout', {
      cartSize: String(cart.length),
      cartSubtotal: String(subtotal),
      discountTotal: String(discountTotal)
    }, {
      triggerName: 'click',
      importance: 'critical'
    });
    setCheckoutDialogOpen(true);
  }

  function closeCheckoutDialog() {
    trackAppAction('checkout-dialog:close', {}, {
      triggerName: 'click'
    });
    setCheckoutDialogOpen(false);
  }

  function trackCheckoutGrafanaLink() {
    trackAppAction('navigate-checkout:grafana', {
      targetUrl: grafanaStackUrl
    }, {
      triggerName: 'click'
    });
  }

  function updateQuantity(key, quantity) {
    const item = enrichedCart.find(candidate => candidate.key === key) || cart.find(candidate => candidate.key === key);
    trackAppAction(quantity <= 0
      ? faroActionName('shopping-cart:remove-item', item?.productId || key)
      : faroActionName('shopping-cart:change-quantity', item?.productId || key), {
      productId: item?.productId,
      productName: item?.name,
      quantity
    }, {
      triggerName: quantity <= 0 ? 'click' : 'change'
    });
    if (quantity <= 0) {
      setCart(current => current.filter(item => item.key !== key));
      return;
    }
    setCart(current => current.map(item => item.key === key ? { ...item, quantity } : item));
  }

  function submitAccount(event) {
    event.preventDefault();
    trackAppAction('save-account', {
      accountEmail: account.email,
      shippingCountry: account.shippingAddress.country,
      walletLabel: account.wallet.label
    }, {
      triggerName: 'submit',
      importance: 'critical'
    });
    saveAccount(account, authSession).catch(() => {
      localStorage.removeItem('ensemble-account');
      alert(t.walletError);
    });
  }

  function loginWithGoogle() {
    trackAppAction('auth:google-login-start', {}, { importance: 'critical' });
    window.setTimeout(() => {
      beginGoogleLogin().catch(error => {
        setAuthError(error.message);
        trackAppAction('auth:google-login-error', { error: error.message });
      });
    }, 500);
  }

  function signOut() {
    trackAppAction('auth:sign-out');
    localStorage.removeItem(authStorageKey);
    setAuthSession(null);
    setAccount(current => ({
      ...current,
      id: emptyAccount.id,
      name: emptyAccount.name,
      email: emptyAccount.email
    }));
  }

  return (
    <main>
      <header>
        <div className="utilityBanner">
          <div className="brandFamily" aria-label={t.brandFamilyLabel}>
            <a href="#shop" onClick={() => trackAppAction('navigate-brand-family:ensemble')} data-faro-user-action-name="navigate-brand-family:ensemble">Ensemble</a>
            <a href="#shop" onClick={() => trackAppAction('navigate-brand-family:outlet')} data-faro-user-action-name="navigate-brand-family:outlet">Outlet</a>
            <a href="#shop" onClick={() => trackAppAction('navigate-brand-family:trail-lab')} data-faro-user-action-name="navigate-brand-family:trail-lab">Trail Lab</a>
            <a href="#shop" onClick={() => trackAppAction('navigate-brand-family:regear')} data-faro-user-action-name="navigate-brand-family:regear">Regear</a>
          </div>
          <p className="promoMessage">
            <a href="#sale" onClick={() => trackAppAction('navigate-sale:spring-collection-sale')} data-faro-user-action-name="navigate-sale:spring-collection-sale"><strong>{t.springSale}</strong></a>
            <span>| {t.freeShipping}</span>
          </p>
          <div className="utilityLinks">
            <a href="#account" onClick={() => trackAppAction('navigate-utility:find-store')} data-faro-user-action-name="navigate-utility:find-store">{t.findStore}</a>
            <label className="regionSelector">
              <span className="regionFlag" aria-hidden="true">{selectedRegion.flag}</span>
              <select id="region-selector" name="region" autoComplete="country" value={region} onChange={event => changeRegion(event.target.value)} aria-label={t.regionSelector} data-faro-user-action-name="open-region-selector">
                {regions.map(item => (
                  <option value={item.code} key={item.code}>{item.label}</option>
                ))}
              </select>
            </label>
            <a href="#account" onClick={() => trackAppAction('navigate-utility:help')} data-faro-user-action-name="navigate-utility:help">{t.help}</a>
          </div>
        </div>

        <div className="topbar">
          <strong className="brand">Ensemble-Retail</strong>
        <div className="headerActions">
          <nav>
            <a href="#shop" onClick={() => trackAppAction('navigate-header:shop')} data-faro-user-action-name="navigate-header:shop">{t.shop}</a>
            <a href="#cart" onClick={() => trackAppAction('navigate-header:cart', { cartSize: cart.length })} data-faro-user-action-name="navigate-header:cart">{t.cart} ({cart.length})</a>
            <a href="#account" onClick={() => trackAppAction('navigate-header:account')} data-faro-user-action-name="navigate-header:account">{t.account}</a>
          </nav>
        </div>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">{t.heroEyebrow}</p>
          <h1>{t.heroTitle}</h1>
          <a className="heroLink" href="#shop" onClick={() => trackAppAction('navigate-hero:shop-new-arrivals')} data-faro-user-action-name="navigate-hero:shop-new-arrivals">{t.heroCta}</a>
        </div>
      </section>

      <section id="shop" className="shop">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">{t.categories}</p>
            <h2>{t.categoryTitle}</h2>
          </div>
          <div className="controls">
            <input id="product-search" name="productSearch" autoComplete="off" value={query} onChange={event => {
              trackAppAction('search-products', { query: event.target.value }, { triggerName: 'change' });
              setQuery(event.target.value);
            }} placeholder={t.searchPlaceholder} />
            <select id="product-sort" name="productSort" autoComplete="off" value={sort} onChange={event => {
              trackAppAction(faroActionName('sort-products', event.target.value), { sort: event.target.value }, { triggerName: 'change' });
              setSort(event.target.value);
            }} aria-label={t.sortProducts}>
              <option value="featured">{t.sortFeatured}</option>
              <option value="price-low">{t.sortPriceLow}</option>
              <option value="price-high">{t.sortPriceHigh}</option>
              <option value="rating">{t.sortRating}</option>
            </select>
          </div>
        </div>

        <div className="departmentTabs" aria-label={t.topLevelCategories}>
          {['mens', 'womens'].map(department => (
            <button
              className={department === activeDepartment ? 'active' : ''}
              key={department}
              onClick={() => selectDepartment(department)}
              data-faro-user-action-name={faroActionName('select-department', department)}
            >
              {departmentLabel(department)}
            </button>
          ))}
        </div>

        <div className="tabs" aria-label={`${departmentLabel(activeDepartment)} ${t.categories.toLowerCase()}`}>
          {departmentCategories.map(category => (
            <button className={category === activeCategory ? 'active' : ''} key={category} onClick={() => selectCategory(category)} data-faro-user-action-name={faroActionName('select-category', `${activeDepartment}-${category}`)}>
              {localizeCategory(category)}
            </button>
          ))}
        </div>

        <div className="productGrid">
          {visibleProducts.map(product => (
            <article className="productCard" key={product.id}>
              <button className="imageButton" onClick={() => viewProduct(product, 'product-grid')} aria-label={t.viewProduct(localizeProductName(product))} data-faro-user-action-name={faroActionName('view-product', product.id)}>
                <img src={product.image} alt={localizeProductName(product)} />
              </button>
              <div className="productInfo">
                <span>{localizeBadge(product.badge)}</span>
                <h3>{localizeProductName(product)}</h3>
                <p>{departmentLabel(product.department)} {localizeCategory(product.category)} · {product.colors.map(localizeColor).join(', ')}</p>
                <div className="productFooter">
                  <p className={product.originalPrice ? 'salePrice' : 'regularPrice'}>
                    {product.originalPrice && <span>${product.originalPrice}</span>}
                    <strong>${product.price}</strong>
                    {product.originalPrice && <em>{discountPercent(product)}% {t.off}</em>}
                  </p>
                  <button onClick={() => addToCart(product, { actionName: faroActionName('shopping-cart:add-item', product.id), source: 'product-grid' })} data-faro-user-action-name={faroActionName('shopping-cart:add-item', product.id)}>{t.add}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="sale" className="saleSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">{t.springSale}</p>
            <h2>{t.saleTitle}</h2>
          </div>
          <a className="textButton" href="#shop" onClick={() => trackAppAction('navigate-sale:shop-all')} data-faro-user-action-name="navigate-sale:shop-all">{t.shopAll}</a>
        </div>

        <div className="productGrid saleGrid">
          {saleProducts.map(product => (
            <article className="productCard" key={`sale-${product.id}`}>
              <button className="imageButton" onClick={() => viewProduct(product, 'sale-grid')} aria-label={t.viewProduct(localizeProductName(product))} data-faro-user-action-name={faroActionName('view-sale-product', product.id)}>
                <img src={product.image} alt={localizeProductName(product)} />
              </button>
              <div className="productInfo">
                <span>15 % {t.off}</span>
                <h3>{localizeProductName(product)}</h3>
                <p>{departmentLabel(product.department)} {localizeCategory(product.category)}</p>
                <div className="productFooter">
                  <p className="salePrice">
                    <span>${product.originalPrice}</span>
                    <strong>${product.price}</strong>
                    <em>{discountPercent(product)}% {t.off}</em>
                  </p>
                  <button onClick={() => addToCart(product, { actionName: faroActionName('shopping-cart:add-sale-item', product.id), source: 'sale-grid' })} data-faro-user-action-name={faroActionName('shopping-cart:add-sale-item', product.id)}>{t.add}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedProduct && (
        <section className="detail">
          <img src={selectedProduct.image} alt={localizeProductName(selectedProduct)} />
          <div>
            <button className="textButton" onClick={closeProductDetail} data-faro-user-action-name={faroActionName('close-product-detail', selectedProduct.id)}>{t.close}</button>
            <p className="eyebrow">{localizeCategory(selectedProduct.category)}</p>
            <h2>{localizeProductName(selectedProduct)}</h2>
            <p>{t.productDescription}</p>
            <p className={selectedProduct.originalPrice ? 'salePrice' : 'regularPrice'}>
              {selectedProduct.originalPrice && <span>${selectedProduct.originalPrice}</span>}
              <strong>${selectedProduct.price}</strong>
              {selectedProduct.originalPrice && <em>{discountPercent(selectedProduct)}% {t.off}</em>}
            </p>
            <p>{t.sizes}: {selectedProduct.sizes.join(' / ')}</p>
            <p>{t.colors}: {selectedProduct.colors.map(localizeColor).join(' / ')}</p>
            <button onClick={() => addToCart(selectedProduct, { actionName: faroActionName('shopping-cart:add-detail-item', selectedProduct.id), source: 'product-detail' })} data-faro-user-action-name={faroActionName('shopping-cart:add-detail-item', selectedProduct.id)}>{t.addSelectedDefault}</button>
          </div>
        </section>
      )}

      <section id="cart" className="cartAccount">
        <div>
          <p className="eyebrow">{t.shoppingCart}</p>
          <h2>{t.cartTitle}</h2>
          {cart.length === 0 && <p>{t.emptyCart}</p>}
          {enrichedCart.map(item => (
            <div className="cartRow" key={item.key}>
              <img src={item.image} alt="" />
              <div>
                <strong>{item.displayName || item.name}</strong>
                <p>{item.displayColor || item.color} · {item.size}</p>
                {item.originalPrice && (
                  <p className="cartDiscount">
                    <span>${item.originalPrice}</span>
                    <strong>${item.price}</strong>
                    <em>{discountPercent(item)}% {t.off}</em>
                  </p>
                )}
              </div>
              <input
                id={`quantity-${item.key}`}
                name={`quantity-${item.key}`}
                type="number"
                min="0"
                autoComplete="off"
                value={item.quantity}
                aria-label={t.quantityFor(item.displayName || item.name)}
                onChange={event => updateQuantity(item.key, Number(event.target.value))}
                data-faro-user-action-name={faroActionName('shopping-cart:change-quantity', item.productId)}
              />
              <strong>${item.price * item.quantity}</strong>
              <button className="deleteCartItem" type="button" onClick={() => updateQuantity(item.key, 0)} aria-label={t.removeFromCart(item.displayName || item.name)} title={t.removeFromCart(item.displayName || item.name)} data-faro-user-action-name={faroActionName('shopping-cart:remove-item', item.productId)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
                </svg>
              </button>
            </div>
          ))}
          <div className="checkout">
            <span>{t.originalSubtotal}</span>
            <strong>${originalSubtotal}</strong>
          </div>
          {discountTotal > 0 && (
            <div className="checkout discountLine">
              <span>{t.saleDiscount(checkoutDiscountPercent)}</span>
              <strong>-${discountTotal}</strong>
            </div>
          )}
          <div className="checkout totalLine">
            <span>{t.subtotal}</span>
            <strong>${subtotal}</strong>
          </div>
          <button disabled={!cart.length} onClick={mockCheckout} data-faro-user-action-name="shopping-cart:checkout">{t.mockCheckout}</button>
        </div>

        <form id="account" onSubmit={submitAccount}>
          <p className="eyebrow">{t.account}</p>
          <h2>{t.accountTitle}</h2>
          <div className="authPanel">
            {authSession ? (
              <>
                <p>{t.signedInAs(authSession.user.email || authSession.user.name)}</p>
                <button type="button" className="textButton" onClick={signOut} data-faro-user-action-name="auth:sign-out">{t.signOut}</button>
              </>
            ) : (
              <>
                <button type="button" onClick={loginWithGoogle} disabled={!authConfigured} data-faro-user-action-name="auth:google-login-start">{t.signInWithGoogle}</button>
                {!authConfigured && <p className="formHint">{t.signInUnavailable}</p>}
              </>
            )}
            {authError && <p className="formError">{authError}</p>}
          </div>
          <label htmlFor="account-name">{t.name}<input id="account-name" name="name" autoComplete="name" value={account.name} onChange={event => {
            trackAppAction('edit-account-name', {}, { triggerName: 'change' });
            setAccount({ ...account, name: event.target.value });
          }} /></label>
          <label htmlFor="account-email">{t.email}<input id="account-email" name="email" type="email" autoComplete="email" value={account.email} onChange={event => {
            trackAppAction('edit-account-email', {}, { triggerName: 'change' });
            setAccount({ ...account, email: event.target.value });
          }} /></label>
          <label htmlFor="shipping-address">{t.address}<input id="shipping-address" name="shippingAddress" autoComplete="shipping street-address" value={account.shippingAddress.line1} onChange={event => {
            trackAppAction('edit-shipping-address', {}, { triggerName: 'change' });
            setAccount({ ...account, shippingAddress: { ...account.shippingAddress, line1: event.target.value } });
          }} /></label>
          <label htmlFor="shipping-city">{t.city}<input id="shipping-city" name="shippingCity" autoComplete="shipping address-level2" value={account.shippingAddress.city} onChange={event => {
            trackAppAction('edit-shipping-city', {}, { triggerName: 'change' });
            setAccount({ ...account, shippingAddress: { ...account.shippingAddress, city: event.target.value } });
          }} /></label>
          <label htmlFor="wallet-label">{t.wallet}<input id="wallet-label" name="walletLabel" autoComplete="off" maxLength="80" value={account.wallet.label} onChange={event => {
            trackAppAction('edit-wallet-label', {}, { triggerName: 'change' });
            setAccount({ ...account, wallet: { ...account.wallet, label: event.target.value } });
          }} /></label>
          <button type="submit" data-faro-user-action-name="save-account">{t.saveAccount}</button>
        </form>
      </section>

      {checkoutDialogOpen && (
        <div className="checkoutDialogBackdrop" role="presentation">
          <section className="checkoutDialog" role="dialog" aria-modal="true" aria-labelledby="checkout-dialog-title">
            <GrafanaLogoMark />
            <div>
              <p className="eyebrow">Grafana</p>
              <h2 id="checkout-dialog-title">{t.checkoutDialogTitle}</h2>
              <p>
                <CheckoutTraceCopy copyText={t.checkoutConfirmed} onGrafanaClick={trackCheckoutGrafanaLink} />
              </p>
              <button type="button" onClick={closeCheckoutDialog} data-faro-user-action-name="checkout-dialog:close">{t.close}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
