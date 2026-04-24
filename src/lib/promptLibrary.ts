import { PromptPreset, TagDefinition } from '../types';

export const promptPresets: PromptPreset[] = [
  {
    id: 'dreamy-portrait',
    category: 'portrait',
    featured: true,
    title: {
      zh: '氛围人像',
      en: 'Dreamy Portrait',
    },
    description: {
      zh: '适合打造细腻、诗意、具有电影感的人像作品。',
      en: 'Soft poetic portraiture with a cinematic editorial touch.',
    },
    prompt: {
      zh: '一位主体明确的人像照片，柔和自然光，浅景深，皮肤质感细腻，镜头语言克制，画面留白优雅，电影感色彩，高清细节',
      en: 'A refined portrait of a single subject, soft natural light, shallow depth of field, delicate skin texture, elegant negative space, cinematic color grading, high detail',
    },
    tags: ['soft light', '35mm photography', 'bokeh', 'editorial', 'high detail'],
    recommendedNegativePrompt: 'low quality, extra fingers, deformed face, oversaturated, blurry',
  },
  {
    id: 'cinematic-scene',
    category: 'cinematic',
    featured: true,
    title: {
      zh: '电影场景',
      en: 'Cinematic Scene',
    },
    description: {
      zh: '适合叙事感强、光影戏剧化的画面。',
      en: 'Ideal for storytelling visuals with dramatic light and atmosphere.',
    },
    prompt: {
      zh: '电影剧照风格的场景，主体突出，镜头构图讲究，体积光与环境雾气，丰富层次，真实材质，具有叙事张力',
      en: 'A cinematic still frame with strong subject focus, thoughtful composition, volumetric light, atmospheric haze, layered depth, realistic materials, visual storytelling tension',
    },
    tags: ['cinematic lighting', 'dramatic composition', 'atmospheric haze', 'high contrast', 'ultra detailed'],
    recommendedNegativePrompt: 'flat lighting, bad anatomy, duplicate subjects, noisy image, artifacts',
  },
  {
    id: 'anime-key-visual',
    category: 'illustration',
    featured: true,
    title: {
      zh: '二次元主视觉',
      en: 'Anime Key Visual',
    },
    description: {
      zh: '适合角色立绘、海报和日系幻想插画。',
      en: 'Great for character key visuals, posters, and stylized fantasy illustration.',
    },
    prompt: {
      zh: '高完成度日系插画，角色设计清晰，色彩层次丰富，线条干净，构图有冲击力，主视觉海报感，精致背景',
      en: 'A polished anime illustration with clear character design, rich color layering, clean linework, striking composition, key visual poster feeling, detailed background',
    },
    tags: ['anime style', 'clean lineart', 'vibrant colors', 'poster composition', 'masterpiece'],
    recommendedNegativePrompt: 'lowres, messy lineart, mutated hands, text, watermark',
  },
  {
    id: 'product-editorial',
    category: 'product',
    featured: false,
    title: {
      zh: '产品静物',
      en: 'Product Editorial',
    },
    description: {
      zh: '适合香水、饰品、包装、品牌海报。',
      en: 'For perfume, jewelry, packaging, and premium campaign visuals.',
    },
    prompt: {
      zh: '高级商业产品摄影，主体干净利落，材质表现清晰，棚拍质感，品牌海报构图，背景克制，细节锐利',
      en: 'Luxury commercial product photography, crisp subject isolation, premium material rendering, studio quality lighting, brand campaign composition, restrained background, sharp details',
    },
    tags: ['studio lighting', 'product photography', 'luxury branding', 'sharp focus', 'clean background'],
    recommendedNegativePrompt: 'cropped object, distorted shape, cluttered background, blur, low contrast',
  },
  {
    id: 'interior-poetry',
    category: 'space',
    featured: true,
    title: {
      zh: '空间美学',
      en: 'Interior Poetry',
    },
    description: {
      zh: '适合家居、建筑、生活方式空间图。',
      en: 'For interior, architecture, and tasteful lifestyle scenes.',
    },
    prompt: {
      zh: '富有文艺气质的室内空间，材质自然，光线温柔，构图平衡，生活痕迹克制，设计杂志封面质感',
      en: 'An artful interior scene with natural materials, gentle lighting, balanced composition, restrained lived-in details, design magazine quality',
    },
    tags: ['interior design', 'soft daylight', 'natural materials', 'editorial styling', 'calm mood'],
    recommendedNegativePrompt: 'warped walls, clutter, low resolution, bad perspective, noisy shadows',
  },
];

export const tagDefinitions: TagDefinition[] = [
  {
    id: 'quality-masterpiece',
    group: 'quality',
    featured: true,
    label: { zh: '高完成度', en: 'Masterpiece' },
    description: { zh: '适合大多数高质量出图需求。', en: 'A strong baseline quality booster for most generations.' },
    value: 'masterpiece, best quality, ultra detailed',
  },
  {
    id: 'lighting-golden-hour',
    group: 'lighting',
    featured: true,
    label: { zh: '黄金时刻', en: 'Golden Hour' },
    description: { zh: '温暖、柔和、浪漫的自然光。', en: 'Warm romantic natural light near sunset.' },
    value: 'golden hour lighting, warm rim light, soft glow',
  },
  {
    id: 'lighting-neon',
    group: 'lighting',
    featured: true,
    label: { zh: '霓虹夜色', en: 'Neon Night' },
    description: { zh: '适合赛博、都市、夜景氛围。', en: 'Perfect for cyberpunk and urban nocturnal moods.' },
    value: 'neon lighting, magenta and cyan glow, night atmosphere',
  },
  {
    id: 'composition-closeup',
    group: 'composition',
    featured: false,
    label: { zh: '近景特写', en: 'Close-Up' },
    description: { zh: '强化主体细节与情绪。', en: 'Emphasize detail and intimacy around the subject.' },
    value: 'close-up framing, intimate composition, focused subject',
  },
  {
    id: 'composition-wide',
    group: 'composition',
    featured: true,
    label: { zh: '电影广角', en: 'Wide Frame' },
    description: { zh: '适合展示环境叙事。', en: 'Useful when environment storytelling matters.' },
    value: 'wide shot, environmental storytelling, cinematic framing',
  },
  {
    id: 'style-film',
    group: 'style',
    featured: true,
    label: { zh: '胶片质感', en: 'Film Look' },
    description: { zh: '带有颗粒与电影调色。', en: 'Adds film grain and cinematic grading.' },
    value: 'film grain, cinematic color grading, analog texture',
  },
  {
    id: 'style-watercolor',
    group: 'style',
    featured: false,
    label: { zh: '水彩笔触', en: 'Watercolor' },
    description: { zh: '适合柔和插画与艺术海报。', en: 'Soft painterly look for artistic illustrations.' },
    value: 'watercolor wash, painterly brushstrokes, delicate texture',
  },
  {
    id: 'camera-85mm',
    group: 'camera',
    featured: false,
    label: { zh: '85mm 镜头', en: '85mm Lens' },
    description: { zh: '适合高级人像压缩感。', en: 'Classic flattering portrait compression.' },
    value: '85mm lens, portrait photography, shallow depth of field',
  },
  {
    id: 'camera-macro',
    group: 'camera',
    featured: true,
    label: { zh: '微距细节', en: 'Macro Detail' },
    description: { zh: '适合珠宝、食物、植物等细节。', en: 'For jewelry, food, flora, and texture-rich close shots.' },
    value: 'macro photography, extreme detail, texture focus',
  },
  {
    id: 'mood-ethereal',
    group: 'mood',
    featured: true,
    label: { zh: '空灵感', en: 'Ethereal' },
    description: { zh: '偏轻盈、诗意、梦境感。', en: 'Light, poetic, dreamlike atmosphere.' },
    value: 'ethereal mood, dreamy atmosphere, poetic composition',
  },
  {
    id: 'mood-mysterious',
    group: 'mood',
    featured: false,
    label: { zh: '神秘感', en: 'Mysterious' },
    description: { zh: '适合悬疑、幻想、暗色调。', en: 'For mystery, fantasy, and darker narratives.' },
    value: 'mysterious mood, moody shadows, dramatic atmosphere',
  },
  {
    id: 'material-glass',
    group: 'material',
    featured: true,
    label: { zh: '玻璃与折射', en: 'Glass Refraction' },
    description: { zh: '适合透明材质和高级静物。', en: 'Enhances transparency, reflection, and luxury surfaces.' },
    value: 'glass refraction, reflective surfaces, translucent material detail',
  },
];
