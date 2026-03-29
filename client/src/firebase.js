import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAM9cUbs4AT3rrPm-Exuk7yXjcoAZO-zqg",
  authDomain: "monopoly-bankerr.firebaseapp.com",
  databaseURL: "https://monopoly-bankerr-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monopoly-bankerr",
  storageBucket: "monopoly-bankerr.firebasestorage.app",
  messagingSenderId: "1025495162393",
  appId: "1:1025495162393:web:eaf6760c2c8ddb6d6d9488"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
