import { getRequestConfig } from 'next-intl/server';
import messages from '@/messages/uz.json';

// One language: the page is in Uzbek, the lessons in Korean.
export default getRequestConfig(async () => ({ locale: 'uz', messages, timeZone: 'Asia/Seoul' }));
