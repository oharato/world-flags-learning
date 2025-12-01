export type Language = 'ja' | 'en';

export interface Translations {
  common: {
    backToHome: string;
  };
  home: {
    title: string;
    startQuiz: string;
    study: string;
    viewRanking: string;
    contact: string;
  };
  quizSetup: {
    title: string;
    nickname: string;
    nicknamePlaceholder: string;
    quizFormat: string;
    flagToName: string;
    nameToFlag: string;
    region: string;
    numberOfQuestions: string;
    questions5: string;
    questions10: string;
    questions30: string;
    questionsAll: string;
    start: string;
    preparingData: string;
    error: string;
    noData: string;
    keyboardHint: string;
    // バリデーションエラー
    nicknameRequired: string;
    nicknameTooLong: string;
    nicknameInvalidChars: string;
  };
  quizPlay: {
    question: string;
    elapsedTime: string;
    seconds: string;
    loadError: string;
    flagAlt: string;
    noData: string;
    goToSetup: string;
  };
  quizResult: {
    title: string;
    settings: string;
    nickname: string;
    quizFormat: string;
    region: string;
    questionCount: string;
    questions: string;
    correctAnswers: string;
    time: string;
    seconds: string;
    score: string;
    points: string;
    answerDetails: string;
    question: string;
    questionLabel: string;
    yourAnswer: string;
    correctAnswer: string;
    unknown: string;
    goToRanking: string;
    backToTop: string;
    submitToRanking: string;
    submitting: string;
    submitted: string;
  };
  ranking: {
    title: string;
    display: string;
    dailyRanking: string;
    allTimeTop5: string;
    rank: string;
    nicknameLabel: string;
    scoreLabel: string;
    registeredAt: string;
    loading: string;
    noData: string;
    region: string;
    quizFormat: string;
  };
  study: {
    title: string;
    quizMode: string;
    flagToName: string;
    nameToFlag: string;
    region: string;
    name: string;
    capital: string;
    continent: string;
    flagOrigin: string;
    summary: string;
    noInformation: string;
    keyboardHint: string;
    next: string;
    prev: string;
  };
  quizFormat: {
    flagToName: string;
    nameToFlag: string;
    flagToNameLong: string;
    nameToFlagLong: string;
  };
  region: {
    all: string;
    africa: string;
    asia: string;
    europe: string;
    northAmerica: string;
    southAmerica: string;
    oceania: string;
  };
  contact: {
    title: string;
    description: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    nameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    messageRequired: string;
    submitError: string;
    successTitle: string;
    successMessage: string;
  };
  privacyPolicy: {
    title: string;
    lastUpdated: string;
    introductionTitle: string;
    introductionText: string;
    dataCollectedTitle: string;
    dataCollectedIntro: string;
    dataItem1: string;
    dataItem2: string;
    dataItem3: string;
    dataItem4: string;
    dataItem5: string;
    purposeTitle: string;
    purposeIntro: string;
    purposeItem1: string;
    purposeItem2: string;
    purposeItem3: string;
    analyticsTitle: string;
    analyticsText: string;
    cookiesTitle: string;
    cookiesText: string;
    dataStorageTitle: string;
    dataStorageText: string;
    thirdPartyTitle: string;
    thirdPartyText: string;
    contactTitle: string;
    contactText: string;
  };
  footer: {
    privacyPolicy: string;
    contact: string;
  };
}

export const translations: Record<Language, Translations> = {
  ja: {
    common: {
      backToHome: '< トップページに戻る',
    },
    home: {
      title: '国旗学習ゲーム',
      startQuiz: 'クイズに挑戦する',
      study: '国旗を学習する',
      viewRanking: 'ランキングを見る',
      contact: 'お問い合わせ',
    },
    quizSetup: {
      title: 'クイズ設定',
      nickname: 'ニックネーム（最大20文字）',
      nicknamePlaceholder: 'ニックネームを入力',
      quizFormat: 'クイズ形式',
      flagToName: '国旗 → 国名',
      nameToFlag: '国名 → 国旗',
      region: '出題範囲',
      numberOfQuestions: '問題数',
      questions5: '5問',
      questions10: '10問',
      questions30: '30問',
      questionsAll: 'すべて',
      start: 'スタート',
      preparingData: 'データ準備中...',
      error: 'エラー発生',
      noData: 'データなし',
      keyboardHint: 'ヒント: Ctrl+Enter でクイズ開始',
      nicknameRequired: 'ニックネームを入力してください。',
      nicknameTooLong: 'ニックネームは20文字以内で入力してください。',
      nicknameInvalidChars: 'ニックネームに使用できない文字が含まれています。',
    },
    quizPlay: {
      question: '問題',
      elapsedTime: '経過時間',
      seconds: '秒',
      loadError: 'データの読み込みに失敗しました',
      flagAlt: '国旗',
      noData: 'クイズデータがありません。設定画面に戻ってください。',
      goToSetup: 'クイズ設定へ',
    },
    quizResult: {
      title: '結果発表',
      settings: 'クイズ設定',
      nickname: 'ニックネーム',
      quizFormat: 'クイズ形式',
      region: '出題範囲',
      questionCount: '問題数',
      questions: '問',
      correctAnswers: '正解数',
      time: 'タイム',
      seconds: '秒',
      score: 'スコア',
      points: 'pt',
      answerDetails: '回答詳細',
      question: '問題',
      questionLabel: '問題',
      yourAnswer: 'あなたの回答',
      correctAnswer: '正解',
      unknown: '不明',
      goToRanking: 'ランキングを見る',
      backToTop: 'トップに戻る',
      submitToRanking: 'ランキングに登録する',
      submitting: '登録中...',
      submitted: 'ランキングに登録しました',
    },
    ranking: {
      title: 'ランキング',
      display: '表示',
      dailyRanking: '今日のランキング',
      allTimeTop5: '歴代トップ5',
      rank: '順位',
      nicknameLabel: 'ニックネーム',
      scoreLabel: 'スコア',
      registeredAt: '登録日時',
      loading: 'ランキングを読み込み中...',
      noData: 'まだランキングデータがありません。',
      region: '出題範囲',
      quizFormat: 'クイズ形式',
    },
    study: {
      title: '学習モード',
      quizMode: 'クイズ形式',
      flagToName: '国旗 → 国名',
      nameToFlag: '国名 → 国旗',
      region: '地域',
      name: '国名',
      capital: '首都',
      continent: '大陸',
      flagOrigin: '国旗の由来',
      summary: '概要',
      noInformation: '情報がありません',
      keyboardHint: '矢印キーで移動、スペースキーで表裏切り替え',
      next: '次へ →',
      prev: '← 前へ',
    },
    quizFormat: {
      flagToName: '国旗 → 国名',
      nameToFlag: '国名 → 国旗',
      flagToNameLong: '国旗を見て国名を選ぶ',
      nameToFlagLong: '国名を見て国旗を選ぶ',
    },
    region: {
      all: '全世界',
      africa: 'アフリカ',
      asia: 'アジア',
      europe: 'ヨーロッパ',
      northAmerica: '北アメリカ',
      southAmerica: '南アメリカ',
      oceania: 'オセアニア',
    },
    contact: {
      title: 'お問い合わせ',
      description: 'ご質問やご意見がありましたら、以下のフォームからお気軽にお問い合わせください。',
      name: 'お名前',
      namePlaceholder: 'お名前を入力',
      email: 'メールアドレス',
      emailPlaceholder: 'メールアドレスを入力',
      message: 'メッセージ',
      messagePlaceholder: 'お問い合わせ内容を入力',
      submit: '送信',
      submitting: '送信中...',
      nameRequired: 'お名前を入力してください。',
      emailRequired: 'メールアドレスを入力してください。',
      emailInvalid: '有効なメールアドレスを入力してください。',
      messageRequired: 'メッセージを入力してください。',
      submitError: '送信に失敗しました。しばらくしてから再度お試しください。',
      successTitle: '送信完了',
      successMessage: 'お問い合わせありがとうございます。内容を確認後、ご連絡いたします。',
    },
    privacyPolicy: {
      title: 'プライバシーポリシー',
      lastUpdated: '最終更新日',
      introductionTitle: 'はじめに',
      introductionText:
        '国旗学習アプリ（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。本プライバシーポリシーでは、本アプリがどのような情報を収集し、どのように利用するかについて説明します。',
      dataCollectedTitle: '収集する情報',
      dataCollectedIntro: '本アプリでは、サービスの提供と改善のために以下の情報を収集する場合があります：',
      dataItem1: 'IPアドレス（国・地域の推定に使用）',
      dataItem2: 'ブラウザの種類とバージョン',
      dataItem3: 'アクセス日時',
      dataItem4: '閲覧したページ',
      dataItem5: 'ニックネーム（ランキング登録時のみ、任意入力）',
      purposeTitle: '情報の利用目的',
      purposeIntro: '収集した情報は、以下の目的で利用します：',
      purposeItem1: 'サービスの提供と運用',
      purposeItem2: 'サービスの改善とパフォーマンス最適化',
      purposeItem3: '不正アクセスの検知と防止',
      analyticsTitle: 'アナリティクス',
      analyticsText:
        '本アプリでは、Cloudflare Web Analyticsを使用してサイトの利用状況を分析しています。Cloudflare Web Analyticsは、プライバシーを重視した分析ツールであり、Cookieを使用せず、個人を特定する情報を収集しません。収集されるデータは匿名化され、ページビューや訪問者数などの集計データのみが記録されます。',
      cookiesTitle: 'Cookieについて',
      cookiesText:
        '本アプリは、Cookieを使用していません。言語設定やニックネームなどのユーザー設定は、ブラウザのlocalStorageに保存されます。これらのデータはサーバーに送信されず、お使いのブラウザ内にのみ保存されます。',
      dataStorageTitle: 'データの保存',
      dataStorageText:
        'ランキングデータ（ニックネーム、スコア、登録日時）は、Cloudflare D1データベースに保存されます。これらのデータは、ランキング機能の提供に必要な期間保存されます。アクセスログは一定期間後に自動的に削除されます。',
      thirdPartyTitle: '第三者への提供',
      thirdPartyText:
        '本アプリは、法令に基づく場合を除き、収集した情報を第三者に提供することはありません。ただし、サービスの運営に必要なCloudflareのサービスを利用しており、Cloudflareのプライバシーポリシーが適用されます。',
      contactTitle: 'お問い合わせ',
      contactText:
        '本プライバシーポリシーに関するご質問やご意見がございましたら、GitHubリポジトリのIssueよりお問い合わせください。',
    },
    footer: {
      privacyPolicy: 'プライバシーポリシー',
      contact: 'お問い合わせ',
    },
  },
  en: {
    common: {
      backToHome: '< Back to Home',
    },
    home: {
      title: 'World Flags Learning Game',
      startQuiz: 'Start Quiz',
      study: 'Study Flags',
      viewRanking: 'View Ranking',
      contact: 'Contact Us',
    },
    quizSetup: {
      title: 'Quiz Setup',
      nickname: 'Nickname (max 20 characters)',
      nicknamePlaceholder: 'Enter nickname',
      quizFormat: 'Quiz Format',
      flagToName: 'Flag -> Name',
      nameToFlag: 'Name -> Flag',
      region: 'Region',
      numberOfQuestions: 'Number of Questions',
      questions5: '5 questions',
      questions10: '10 questions',
      questions30: '30 questions',
      questionsAll: 'All',
      start: 'Start',
      preparingData: 'Preparing data...',
      error: 'Error occurred',
      noData: 'No data',
      keyboardHint: 'Hint: Ctrl+Enter to start quiz',
      nicknameRequired: 'Please enter a nickname.',
      nicknameTooLong: 'Nickname must be 20 characters or less.',
      nicknameInvalidChars: 'Nickname contains invalid characters.',
    },
    quizPlay: {
      question: 'Question',
      elapsedTime: 'Elapsed Time',
      seconds: 'seconds',
      loadError: 'Failed to load data',
      flagAlt: 'Flag',
      noData: 'No quiz data. Please return to the setup screen.',
      goToSetup: 'Go to Quiz Setup',
    },
    quizResult: {
      title: 'Results',
      settings: 'Quiz Settings',
      nickname: 'Nickname',
      quizFormat: 'Quiz Format',
      region: 'Region',
      questionCount: 'Questions',
      questions: 'questions',
      correctAnswers: 'Correct',
      time: 'Time',
      seconds: 'seconds',
      score: 'Score',
      points: 'pt',
      answerDetails: 'Answer Details',
      question: 'Question',
      questionLabel: 'Question',
      yourAnswer: 'Your Answer',
      correctAnswer: 'Correct Answer',
      unknown: 'Unknown',
      goToRanking: 'View Ranking',
      backToTop: 'Back to Home',
      submitToRanking: 'Submit to Ranking',
      submitting: 'Submitting...',
      submitted: 'Submitted to Ranking',
    },
    ranking: {
      title: 'Ranking',
      display: 'Display',
      dailyRanking: "Today's Ranking",
      allTimeTop5: 'All-Time Top 5',
      rank: 'Rank',
      nicknameLabel: 'Nickname',
      scoreLabel: 'Score',
      registeredAt: 'Registered At',
      loading: 'Loading ranking...',
      noData: 'No ranking data yet.',
      region: 'Region',
      quizFormat: 'Quiz Format',
    },
    study: {
      title: 'Study Mode',
      quizMode: 'Quiz Format',
      flagToName: 'Flag -> Name',
      nameToFlag: 'Name -> Flag',
      region: 'Region',
      name: 'Country',
      capital: 'Capital',
      continent: 'Continent',
      flagOrigin: 'Flag Origin',
      summary: 'Summary',
      noInformation: 'No information available',
      keyboardHint: 'Arrow keys to navigate, Space to flip',
      next: 'Next →',
      prev: '← Prev',
    },
    quizFormat: {
      flagToName: 'Flag -> Name',
      nameToFlag: 'Name -> Flag',
      flagToNameLong: 'See flag, choose country name',
      nameToFlagLong: 'See country name, choose flag',
    },
    region: {
      all: 'All World',
      africa: 'Africa',
      asia: 'Asia',
      europe: 'Europe',
      northAmerica: 'North America',
      southAmerica: 'South America',
      oceania: 'Oceania',
    },
    contact: {
      title: 'Contact Us',
      description: 'If you have any questions or feedback, please feel free to contact us using the form below.',
      name: 'Name',
      namePlaceholder: 'Enter your name',
      email: 'Email',
      emailPlaceholder: 'Enter your email',
      message: 'Message',
      messagePlaceholder: 'Enter your message',
      submit: 'Send',
      submitting: 'Sending...',
      nameRequired: 'Please enter your name.',
      emailRequired: 'Please enter your email.',
      emailInvalid: 'Please enter a valid email address.',
      messageRequired: 'Please enter your message.',
      submitError: 'Failed to send. Please try again later.',
      successTitle: 'Message Sent',
      successMessage: 'Thank you for your message. We will get back to you soon.',
    },
    privacyPolicy: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated',
      introductionTitle: 'Introduction',
      introductionText:
        'World Flags Learning Game (hereinafter "this app") respects user privacy and is committed to protecting personal information. This Privacy Policy explains what information this app collects and how it is used.',
      dataCollectedTitle: 'Information We Collect',
      dataCollectedIntro: 'This app may collect the following information to provide and improve our services:',
      dataItem1: 'IP address (used to estimate country/region)',
      dataItem2: 'Browser type and version',
      dataItem3: 'Access date and time',
      dataItem4: 'Pages viewed',
      dataItem5: 'Nickname (only when registering for ranking, optional)',
      purposeTitle: 'How We Use Information',
      purposeIntro: 'We use the collected information for the following purposes:',
      purposeItem1: 'Providing and operating our services',
      purposeItem2: 'Improving services and optimizing performance',
      purposeItem3: 'Detecting and preventing unauthorized access',
      analyticsTitle: 'Analytics',
      analyticsText:
        'This app uses Cloudflare Web Analytics to analyze site usage. Cloudflare Web Analytics is a privacy-focused analytics tool that does not use cookies and does not collect personally identifiable information. The collected data is anonymized, and only aggregate data such as page views and visitor counts are recorded.',
      cookiesTitle: 'About Cookies',
      cookiesText:
        "This app does not use cookies. User settings such as language preferences and nicknames are stored in your browser's localStorage. This data is not sent to the server and is only stored within your browser.",
      dataStorageTitle: 'Data Storage',
      dataStorageText:
        'Ranking data (nickname, score, registration date) is stored in Cloudflare D1 database. This data is retained for as long as necessary to provide the ranking feature. Access logs are automatically deleted after a certain period.',
      thirdPartyTitle: 'Third Party Disclosure',
      thirdPartyText:
        "This app does not provide collected information to third parties except as required by law. However, we use Cloudflare services for operation, and Cloudflare's privacy policy applies.",
      contactTitle: 'Contact Us',
      contactText:
        'If you have any questions or concerns about this Privacy Policy, please contact us through GitHub repository Issues.',
    },
    footer: {
      privacyPolicy: 'Privacy Policy',
      contact: 'Contact Us',
    },
  },
};
