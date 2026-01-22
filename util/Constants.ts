import { ClipboardItem, ClipboardType } from '../types';

// --- Colors ---
export const THEME_COLORS = {
  GOLD: '#D4AF37',
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  DARK_GRAY: '#1A1A1A'
};

// --- Mock Data ---
export const INITIAL_CLIPBOARD_DATA: ClipboardItem[] = [
  {
    id: '1',
    content: 'Your paragraph tex buhuhuhuh jebuetguejjebuebgueugeutmmm',
    type: ClipboardType.TEXT,
    timestamp: '10:44 PM • 20 Dec',
    tags: ['#work'],
    isPinned: true,
    isDeleted: true,
  },
  {
    id: '2',
    content: 'my credit card no is *******1234 with pin *****abc',
    displayContent: 'my credit card no is *******1234\nwith pin *****abc',
    type: ClipboardType.SECURE,
    timestamp: '10:43 PM • 23 Dec',
    tags: ['#sport'],
    isPinned: false,
    isDeleted: true,
  },
  {
    id: '3',
    content: 'https://www.google.com',
    type: ClipboardType.LINK,
    timestamp: '10:42 PM • 23 Dec',
    tags: ['#sport'],
    isPinned: false,
    isDeleted: true,
  },
  {
    id: '4',
    content: '+99 9876543210',
    type: ClipboardType.PHONE,
    timestamp: '10:42 PM • 23 Dec',
    tags: ['#sport'],
    isPinned: false,
    isDeleted: true,
  },
  {
    id: '5',
    content: '33rd Street, Fifth Avenue, New York City, New York, United States',
    type: ClipboardType.LOCATION,
    timestamp: '10:42 PM • 23 Dec',
    tags: ['#sport'],
    isPinned: false,
    isDeleted: true,
  },
  {
    id: '6',
    content: 'Meeting notes: Discuss Q1 roadmap and budget allocation.',
    type: ClipboardType.TEXT,
    timestamp: '09:00 AM • 24 Dec',
    tags: ['#work'],
    isPinned: false,
    isDeleted: false,
  },
  {
    id: '7',
    content: 'Buy milk, eggs, and bread on the way home.',
    type: ClipboardType.TEXT,
    timestamp: '06:30 PM • 24 Dec',
    tags: ['#personal'],
    isPinned: false,
    isDeleted: false,
  }
];

// --- Static Lists ---
export const GOOGLE_TRANSLATE_LANGUAGES = [
    "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese", "Aymara", "Azerbaijani", 
    "Bambara", "Basque", "Belarusian", "Bengali", "Bhojpuri", "Bosnian", "Bulgarian", 
    "Catalan", "Cebuano", "Chichewa", "Chinese (Simplified)", "Chinese (Traditional)", "Corsican", "Croatian", "Czech", 
    "Danish", "Dhivehi", "Dogri", "Dutch", 
    "English", "Esperanto", "Estonian", "Ewe", 
    "Filipino", "Finnish", "French", "Frisian", 
    "Galician", "Georgian", "German", "Greek", "Guarani", "Gujarati", 
    "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", "Hungarian", 
    "Icelandic", "Igbo", "Ilocano", "Indonesian", "Irish", "Italian", 
    "Japanese", "Javanese", 
    "Kannada", "Kazakh", "Khmer", "Kinyarwanda", "Konkani", "Korean", "Krio", "Kurdish (Kurmanji)", "Kurdish (Sorani)", "Kyrgyz", 
    "Lao", "Latin", "Latvian", "Lingala", "Lithuanian", "Luganda", "Luxembourgish", 
    "Macedonian", "Maithili", "Malagasy", "Malay", "Malayalam", "Maltese", "Maori", "Marathi", "Meiteilon (Manipuri)", "Mizo", "Mongolian", "Myanmar (Burmese)", 
    "Nepali", "Norwegian", 
    "Odia (Oriya)", "Oromo", 
    "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", 
    "Quechua", 
    "Romanian", "Russian", 
    "Samoan", "Sanskrit", "Scots Gaelic", "Sepedi", "Serbian", "Sesotho", "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Sundanese", "Swahili", "Swedish", 
    "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Tigrinya", "Tsonga", "Turkish", "Turkmen", "Twi", 
    "Ukrainian", "Urdu", "Uyghur", "Uzbek", 
    "Vietnamese", 
    "Welsh", 
    "Xhosa", 
    "Yiddish", "Yoruba", 
    "Zulu"
];