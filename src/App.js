import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Dumbbell, Calendar, TrendingUp, Timer, Save, Trash2, Play, Pause, RotateCcw, ChevronLeft, BarChart3, Info, Edit, CheckSquare, XCircle, PlusCircle, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Firebase 引入
// 確保您已在終端機中運行 'npm install firebase' 或 'yarn add firebase'
import { initializeApp } from 'firebase/app';
import { getAuth, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth'; // 引入 signInWithCustomToken
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, getDocs } from 'firebase/firestore';

const WorkoutApp = () => {
  // Firebase 變數初始化
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null); // Firebase User ID
  const [isAuthReady, setIsAuthReady] = useState(false); // 認證服務是否準備好

  // 應用程式狀態
  const [currentPage, setCurrentPage] = useState('daily');
  const [workoutData, setWorkoutData] = useState([]);
  const [exercises, setExercises] = useState([]); // 將從 Firebase 載入
  const [workoutPlans, setWorkoutPlans] = useState([]); // 將從 Firebase 載入
  const [bodyStats, setBodyStats] = useState([]); // 將從 Firebase 載入
  const [isLoading, setIsLoading] = useState(true); // 新增載入狀態

  // 計時器狀態 (更新為小時、分鐘、秒獨立輸入，並模擬滾輪樣式)
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(1); // 預設 1 分鐘
  const [timerSecondsInput, setTimerSecondsInput] = useState(30); // 預設 30 秒，用於輸入框
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDisplaySeconds, setTimerDisplaySeconds] = useState(90); // 總秒數用於計時和顯示
  const timerIntervalRef = useRef(null);

  // 今日訓練狀態
  const [todayWorkout, setTodayWorkout] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showDailyHistory, setShowDailyHistory] = useState(false);
  const [editExerciseId, setEditExerciseId] = useState(null);
  const [showExerciseDetailModal, setShowExerciseDetailModal] = useState(false);
  const [currentExerciseDetail, setCurrentExerciseDetail] = useState(null);

  // 自訂動作狀態
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseCategory, setNewExerciseCategory] = useState('');
  const [newExerciseDetails, setNewExerciseDetails] = useState('');
  const [newExerciseType, setNewExerciseType] = useState('自由重量');
  const [newExerciseAdvice, setNewExerciseAdvice] = useState('');

  // 訓練計劃狀態
  const [planName, setPlanName] = useState('');
  const [currentPlanExercises, setCurrentPlanExercises] = useState([]);
  const [selectedCategoryForPlan, setSelectedCategoryForPlan] = useState('');
  const [selectedExerciseIdForPlan, setSelectedExerciseIdForPlan] = useState('');
  const [planExerciseWeight, setPlanExerciseWeight] = useState('');
  const [planExerciseSets, setPlanExerciseSets] = useState('');
  const [planExerciseReps, setPlanExerciseReps] = useState('');

  // AI 訓練計劃生成狀態
  const [planGoal, setPlanGoal] = useState('增肌');
  const [planDuration, setPlanDuration] = useState('60'); // Minutes
  const [planFocus, setPlanFocus] = useState(''); // e.g., '胸部', '全身'
  const [aiPlanLoading, setAiPlanLoading] = useState(false);
  const [aiPlanGenerated, setAiPlanGenerated] = useState(null);
  const [aiPlanError, setAiPlanError] = useState('');

  // 身體數據狀態
  const [bodyWeight, setBodyWeight] = useState('');
  const [muscleWeight, setMuscleWeight] = useState('');
  const [fatWeight, setFatWeight] = useState('');
  const [bodyFatPercent, setBodyFatPercent] = useState('');

  // 統計視圖狀態
  const [statsView, setStatsView] = useState('month');

  // 自訂訊息框狀態
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // AI 動作建議狀態
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);
  const [aiAdviceContent, setAiAdviceContent] = useState('');
  const [aiAdviceError, setAiAdviceError] = useState('');

  // 顯示自訂訊息框
  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  // 自訂訊息框元件
  const AlertModal = ({ message, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
        <h3 className="text-xl font-bold text-gray-800 mb-4">通知</h3>
        <p className="text-gray-700 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          確定
        </button>
      </div>
    </div>
  );

  // Gemini API 呼叫函數
  const callGeminiApi = async (prompt, isJson = false, schema = null) => {
    try {
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      
      const payload = { contents: chatHistory };

      if (isJson && schema) {
          payload.generationConfig = {
              responseMimeType: "application/json",
              responseSchema: schema
          };
      }

      const apiKey = ""; // Canvas 將在執行時注入 API key
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`API 錯誤: ${response.status} - ${errorData.error.message}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
          const text = result.candidates[0].content.parts[0].text;
          return isJson ? JSON.parse(text) : text;
      } else {
          throw new Error("Gemini API 未接收到內容。");
      }
    } catch (error) {
      console.error("Gemini API 呼叫失敗:", error);
      throw error; // 重新拋出，讓呼叫者處理
    }
  };

  // 初始化 Firebase
  useEffect(() => {
    try {
      let firebaseConfig;
      let currentAppId;

      // 優先使用 Canvas 環境提供的全局變數
      if (typeof window.__firebase_config !== 'undefined' && typeof window.__app_id !== 'undefined') {
        console.log("從 Canvas 環境變數載入 Firebase 配置。");
        firebaseConfig = JSON.parse(window.__firebase_config);
        currentAppId = window.__app_id;
      } else {
        // 如果不在 Canvas 環境中，則從 .env 檔案讀取 (適用於本地開發)
        console.log("從 .env 檔案載入 Firebase 配置 (非 Canvas 環境)。");
        firebaseConfig = {
          apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
          authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
          storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.REACT_APP_FIREBASE_APP_ID,
          measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID, // 選填
        };
        currentAppId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
      }

      // 檢查 Firebase 配置是否有效
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase 配置無效。請檢查 .env 檔案或 Canvas 環境變數。");
      }

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);

      setDb(firestore);
      setAuth(authInstance);

      // 監聽 Firebase 認證狀態變化
      const unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("Firebase 認證成功，用戶 ID:", user.uid);
        } else {
          try {
            console.log("未檢測到用戶，嘗試匿名登入或使用自訂 token...");
            // 嘗試使用 Canvas 環境提供的自訂認證 token
            if (typeof window.__initial_auth_token !== 'undefined') {
              console.log("使用自訂認證 token 登入...");
              await signInWithCustomToken(authInstance, window.__initial_auth_token);
            } else {
              console.log("執行匿名登入...");
              await signInAnonymously(authInstance);
            }
            console.log("認證操作已完成。");
          } catch (error) {
            console.error("Firebase 認證失敗:", error);
            showCustomAlert("登入失敗。請檢查網路連接或 Firebase 設定。錯誤: " + error.message);
          }
        }
        setIsLoading(false); 
        setIsAuthReady(true); // 即使有錯誤，也標記為 Auth 服務已啟動
      });

      return () => unsubscribeAuth(); // 清理認證監聽器
    } catch (error) {
      console.error("初始化 Firebase 失敗:", error);
      showCustomAlert("應用程式初始化失敗。請檢查 Firebase 配置和網路。錯誤: " + error.message);
      setIsLoading(false);
      setIsAuthReady(true); // 即使 Firebase 初始化失敗，也允許應用程式渲染
    }
  }, []);

  // 當使用者 ID 可用時，從 Firestore 載入資料
  useEffect(() => {
    if (!db || !userId || !isAuthReady) {
      console.log("等待 Firebase db, userId, 或 isAuthReady 就緒才能載入數據...");
      return;
    }

    console.log("Firebase 已就緒，開始監聽用戶數據...");
    // 獲取 app ID，優先使用 Canvas 環境變數
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';

    // 定義 Firestore 資料路徑（使用用戶 ID 隔離數據）
    const userExercisesPath = `artifacts/${appId}/users/${userId}/exercises`;
    const userWorkoutsPath = `artifacts/${appId}/users/${userId}/workouts`;
    const userPlansPath = `artifacts/${appId}/users/${userId}/plans`;
    const userBodyStatsPath = `artifacts/${appId}/users/${userId}/bodyStats`;

    // 載入初始預設動作 (如果資料庫中沒有此用戶的動作)
    const loadDefaultExercises = async () => {
      try {
        console.log(`檢查 ${userExercisesPath} 是否存在預設動作...`);
        const q = query(collection(db, userExercisesPath));
        const querySnapshot = await getDocs(q); 
        if (querySnapshot.empty) {
          console.log("exercises 集合為空，載入預設動作...");
          const defaultExercisesToUpload = [
            { name: '槓鈴臥推', category: '胸部', muscle: 'chest', details: '平躺於臥推椅，雙手握住槓鈴略寬於肩，將槓鈴下放至胸部上方，然後推起。', type: '自由重量', advice: '保持核心穩定，感受胸肌發力。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Barbell%20Press' },
            { name: '啞鈴臥推', category: '胸部', muscle: 'chest', details: '平躺於臥推椅，雙手各持一個啞鈴，將啞鈴下放至胸部兩側，然後推起。', type: '自由重量', advice: '控制啞鈴下放速度，保持平衡。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Dumbbell%20Press' },
            { name: '上斜臥推', category: '胸部', muscle: 'chest', details: '調整臥推椅至上斜角度，雙手握住槓鈴或啞鈴，將其推起。', type: '自由重量', advice: '上斜臥推主要鍛鍊上胸。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Incline%20Press' },
            { name: '飛鳥', category: '胸部', muscle: 'chest', details: '使用啞鈴或繩索，雙臂向兩側打開，再向中間夾緊，感受胸肌收縮。', type: '自由重量/器械', advice: '保持微屈肘，不要鎖死關節。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Fly' },
            { name: '雙槓撐體', category: '胸部', muscle: 'chest', details: '雙手握住雙槓，身體下降至最低點，然後推起。', type: '自由重量', advice: '身體前傾可更多刺激胸部。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Dips' },
            
            { name: '引體向上', category: '背部', muscle: 'back', details: '雙手握住單槓，向上拉起身體直到下巴過槓。', type: '自由重量', advice: '感受背部肌肉發力，而不是手臂。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Pull%20Up' },
            { name: '槓鈴划船', category: '背部', muscle: 'back', details: '俯身，雙手握住槓鈴，將槓鈴拉向腹部。', type: '自由重量', advice: '保持背部挺直，避免弓背。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Barbell%20Row' },
            { name: '啞鈴划船', category: '背部', muscle: 'back', details: '單手持啞鈴，另一手扶住長凳，將啞鈴拉向身體。', type: '自由重量', advice: '緩慢控制，感受背闊肌的收縮。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Dumbbell%20Row' },
            { name: '滑輪下拉', category: '背部', muscle: 'back', details: '坐在器械上，雙手握住把手，將把手拉向胸部。', type: '器械', advice: '多用背部發力，而非手臂。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Lat%20Pulldown' },
            { name: '硬舉', category: '背部', muscle: 'back', details: '雙腳與肩同寬，俯身握住槓鈴，使用腿部和臀部力量將槓鈴拉起。', type: '自由重量', advice: '是複合動作，注意動作標準性。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Deadlift' },

            { name: '肩推', category: '肩膀', muscle: 'shoulders', details: '坐姿或站姿，雙手持槓鈴或啞鈴，向上推舉過頭。', type: '自由重量/器械', advice: '保持核心收緊，避免過度仰臥。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Shoulder%20Press' },
            { name: '側平舉', category: '肩膀', muscle: 'shoulders', details: '雙手持啞鈴，雙臂向身體兩側抬起，直到與肩同高。', type: '自由重量', advice: '感受肩部側束發力，不要藉助慣性。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Lateral%20Raise' },
            { name: '前平舉', category: '肩膀', muscle: 'shoulders', details: '雙手向前抬起，直到與肩同高。', type: '自由重量', advice: '主要鍛鍊肩部前束。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Front%20Raise' },
            { name: '後束飛鳥', category: '肩膀', muscle: 'shoulders', details: '俯身，雙手持啞鈴，向兩側抬起，感受肩部後束收縮。', type: '自由重量/器械', advice: '針對肩部後束，動作幅度不需過大。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Rear%20Delt%20Fly' },
            { name: '聳肩', category: '肩膀', muscle: 'shoulders', details: '雙手持啞鈴或槓鈴，向上聳肩。', type: '自由重量', advice: '主要鍛鍊斜方肌。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Shrugs' },

            { name: '二頭彎舉', category: '手臂', muscle: 'arms', details: '站姿或坐姿，雙手持啞鈴或槓鈴，向上彎舉，感受二頭肌收縮。', type: '自由重量', advice: '手肘固定，只移動前臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Bicep%20Curl' },
            { name: '三頭下壓', category: '手臂', muscle: 'arms', details: '使用繩索或直槓，雙手向下壓動，感受三頭肌收縮。', type: '器械', advice: '保持大臂不動，只移動小臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Tricep%20Pushdown' },
            { name: '錘式彎舉', category: '手臂', 'muscle': 'arms', details: '雙手持啞鈴，掌心相對，向上彎舉。', type: '自由重量', advice: '刺激二頭肌和前臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Hammer%20Curl' },
            { name: '三頭伸展', category: '手臂', muscle: 'arms', details: '使用啞鈴或繩索，將手臂向後或向上伸展，感受三頭肌收縮。', type: '自由重量/器械', advice: '動作頂端充分收縮三頭肌。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Tricep%20Extension' },
            { name: '窄握推舉', category: '手臂', muscle: 'arms', details: '平躺於臥推椅，雙手窄握槓鈴，將槓鈴下放至胸部上方，然後推起。', type: '自由重量', advice: '主要鍛鍊三頭肌。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Close%20Grip%20Press' },

            { name: '深蹲', category: '腿部', muscle: 'legs', details: '雙腳與肩同寬，背部挺直，屈膝下蹲，大腿與地面平行後站起。', type: '自由重量', advice: '保持核心穩定，膝蓋不要內扣。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Squat' },
            { name: '腿推', category: '腿部', muscle: 'legs', details: '坐在腿推機上，將雙腿推起，感受大腿肌肉收縮。', type: '器械', advice: '膝蓋不要完全鎖死。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Leg%20Press' },
            { name: '腿屈伸', category: '腿部', muscle: 'legs', details: '坐在腿屈伸機上，伸展膝蓋，感受大腿前側肌肉收縮。', type: '器械', advice: '緩慢控制，頂端稍作停留。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Leg%20Extension' },
            { name: '腿後彎舉', category: '腿部', muscle: 'legs', details: '俯臥或坐姿在腿後彎舉機上，彎曲膝蓋，感受大腿後側肌肉收縮。', type: '器械', advice: '充分收縮腿後腱肌。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Hamstring%20Curl' },
            { name: '提踵', category: '腿部', muscle: 'legs', details: '站立，腳尖著地，向上提起腳跟，感受小腿肌肉收縮。', type: '自由重量/器械', advice: '頂端充分收縮小腿。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Calf%20Raise' },

            { name: '仰臥起坐', category: '核心', muscle: 'core', details: '平躺，雙手抱頭或交叉放胸前，向上捲腹。', type: '自由重量', advice: '不要用脖子發力，感受腹肌收縮。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Sit%20Up' },
            { name: '棒式', category: '核心', muscle: 'core', details: '俯臥撐姿勢，用手肘和腳尖支撐身體，保持身體一條直線。', type: '自由重量', advice: '保持核心收緊，臀部不要下塌。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Plank' },
            { name: '俄羅斯轉體', category: '核心', muscle: 'core', details: '坐姿，雙腿抬起，身體向左右轉動，雙手可持重物。', type: '自由重量', advice: '感受腹斜肌的收縮。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Russian%20Twist' },
            { name: '腹部輪', category: '核心', muscle: 'core', details: '跪姿，雙手握住腹部輪，向前滾動，然後收回。', type: '器械', advice: '保持背部平直，核心收緊。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Ab%20Wheel' },
            { name: '懸垂舉腿', category: '核心', muscle: 'core', details: '雙手握住單槓懸垂，向上抬起雙腿。', type: '自由重量', advice: '感受下腹部發力。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Hanging%20Leg%20Raise' }
          ];

          for (const ex of defaultExercisesToUpload) {
            await addDoc(collection(db, userExercisesPath), { ...ex, userId: userId });
          }
          console.log("預設動作已上傳至 Firestore。");
        } else {
          console.log("exercises 集合已存在，無需載入預設動作。");
        }
      } catch (error) {
        console.error("載入預設動作時出錯:", error);
        showCustomAlert("載入預設動作失敗，請檢查網路或 Firebase 設定。錯誤: " + error.message);
      }
    };
    
    // 監聽 exercises 集合的變化
    const unsubscribeExercises = onSnapshot(collection(db, userExercisesPath), (snapshot) => {
      const fetchedExercises = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setExercises(fetchedExercises);
      console.log("已獲取訓練動作:", fetchedExercises.length, "個");
      if (fetchedExercises.length === 0 && isAuthReady) { // 確保只有在認證就緒後才嘗試載入
        loadDefaultExercises();
      }
    }, (error) => {
      console.error("獲取訓練動作時出錯:", error);
      showCustomAlert("載入動作數據失敗。錯誤: " + error.message);
    });

    // 監聽 workoutData 集合的變化
    const unsubscribeWorkouts = onSnapshot(collection(db, userWorkoutsPath), (snapshot) => {
      const fetchedWorkouts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setWorkoutData(fetchedWorkouts);
      console.log("已獲取訓練記錄:", fetchedWorkouts.length, "個");
    }, (error) => {
      console.error("獲取訓練記錄時出錯:", error);
      showCustomAlert("載入訓練數據失敗。錯誤: " + error.message);
    });

    // 監聽 workoutPlans 集合的變化
    const unsubscribePlans = onSnapshot(collection(db, userPlansPath), (snapshot) => {
      const fetchedPlans = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setWorkoutPlans(fetchedPlans);
      console.log("已獲取訓練計劃:", fetchedPlans.length, "個");
    }, (error) => {
      console.error("獲取訓練計劃時出錯:", error);
      showCustomAlert("載入訓練計劃失敗。錯誤: " + error.message);
    });

    // 監聽 bodyStats 集合的變化
    const unsubscribeBodyStats = onSnapshot(collection(db, userBodyStatsPath), (snapshot) => {
      const fetchedBodyStats = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setBodyStats(fetchedBodyStats);
      console.log("已獲取身體數據:", fetchedBodyStats.length, "個");
    }, (error) => {
      console.error("獲取身體數據時出錯:", error);
      showCustomAlert("載入身體數據失敗。錯誤: " + error.message);
    });

    // 清理函數：當元件卸載或 userId 改變時，取消所有 Firestore 數據監聽
    return () => {
      console.log("正在取消 Firestore 數據監聽...");
      unsubscribeExercises();
      unsubscribeWorkouts();
      unsubscribePlans();
      unsubscribeBodyStats();
    };
  }, [db, userId, isAuthReady]);


  // 將小時、分鐘、秒轉換為總秒數
  useEffect(() => {
    const totalSeconds = timerHours * 3600 + timerMinutes * 60 + timerSecondsInput;
    setTimerDisplaySeconds(totalSeconds);
  }, [timerHours, timerMinutes, timerSecondsInput]);

  // 計時器核心邏輯
  useEffect(() => {
    if (isTimerRunning && timerDisplaySeconds > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerDisplaySeconds(prevTime => {
          if (prevTime <= 1) { // 確保不會變成負數
            setIsTimerRunning(false);
            clearInterval(timerIntervalRef.current);
            showCustomAlert('休息時間結束！');
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerDisplaySeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      clearInterval(timerIntervalRef.current);
      showCustomAlert('休息時間結束！');
    } else if (!isTimerRunning && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerDisplaySeconds]); // 依賴 isTimerRunning 和 timerDisplaySeconds

  // 格式化秒數為分:秒的字符串 (支持小時)
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    let formattedTime = '';
    if (hours > 0) {
      formattedTime += `${hours.toString().padStart(1, '0')}:`; // 小時不強制兩位數
    }
    formattedTime += `${minutes.toString().padStart(hours > 0 ? 2 : 1, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedTime;
  };

  // 添加今日訓練記錄到 todayWorkout 列表
  const addTodayWorkout = async () => {
    if (!selectedExerciseId || !weight || !sets || !reps || !db || !userId) {
      showCustomAlert("請選擇動作並填寫所有重量、組數和次數。");
      return;
    }

    const exercise = exercises.find(ex => ex.id === selectedExerciseId);
    if (!exercise) {
      console.error("找不到選定的動作 ID:", selectedExerciseId);
      showCustomAlert("找不到選定的動作。");
      return;
    }

    const newRecord = {
      // 為每個新記錄生成一個唯一 ID，以便在 UI 中追蹤
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), 
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      muscle: exercise.muscle,
      weight: parseFloat(weight),
      sets: parseInt(sets),
      reps: parseInt(reps),
      completed: false,
      details: exercise.details,
      type: exercise.type,
      advice: exercise.advice,
      imageUrl: exercise.imageUrl,
      userId: userId,
    };

    setTodayWorkout([...todayWorkout, newRecord]);

    setSelectedExerciseId('');
    setWeight('');
    setSets('');
    setReps('');
    showCustomAlert(`已將 "${exercise.name}" 加入今日訓練列表。`);
  };

  // 從已儲存的訓練計劃中載入動作到今日訓練
  const loadWorkoutPlan = () => {
    if (!selectedWorkoutPlan) {
      showCustomAlert("請選擇一個訓練計劃。");
      return;
    }

    const plan = workoutPlans.find(p => p.id === selectedWorkoutPlan);
    if (!plan) {
      showCustomAlert("找不到選定的訓練計劃。");
      return;
    }
    if (!plan.exercises || plan.exercises.length === 0) {
      showCustomAlert("此計劃沒有包含任何動作。");
      return;
    }

    const planWorkouts = plan.exercises.map(exercise => ({
      // 為每個新記錄生成一個唯一 ID
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9) + exercise.exerciseId,
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      category: exercise.category,
      muscle: exercise.muscle,
      weight: exercise.weight || 0,
      sets: exercise.sets || 0,
      reps: exercise.reps || 0,
      completed: false,
      details: exercise.details,
      type: exercise.type,
      advice: exercise.advice,
      imageUrl: exercise.imageUrl,
      notes: exercise.notes || '',
      userId: userId,
    }));

    setTodayWorkout(planWorkouts);
    setSelectedWorkoutPlan('');
    showCustomAlert(`訓練計劃 "${plan.name}" 已載入！`);
  };

  // 處理今日訓練記錄的編輯按鈕點擊
  const handleEditTodayWorkout = (id) => {
    setEditExerciseId(id);
  };

  // 確認並保存今日訓練記錄的編輯
  const handleSaveEditTodayWorkout = (id) => {
    setEditExerciseId(null);
  };

  // 取消今日訓練記錄的編輯
  const handleCancelEditTodayWorkout = () => {
    setEditExerciseId(null);
  };

  // 從今日訓練列表中刪除一個項目
  const deleteTodayWorkoutItem = (id) => {
    setTodayWorkout(todayWorkout.filter(workout => workout.id !== id));
  };

  // 切換今日訓練項目完成狀態
  const toggleCompleted = (id) => {
    setTodayWorkout(prevWorkouts => prevWorkouts.map(workout => 
      workout.id === id ? { ...workout, completed: !workout.completed } : workout
    ));
  };

  // 更新今日訓練記錄中的特定欄位 (重量、組數、次數)
  const updateWorkoutRecord = (id, field, value) => {
    setTodayWorkout(prevWorkouts => prevWorkouts.map(workout => 
      workout.id === id ? { ...workout, [field]: field === 'weight' ? parseFloat(value) || 0 : parseInt(value) || 0 } : workout
    ));
  };

  // 將今日訓練列表儲存為新的訓練計劃到 Firestore
  const saveAsNewPlan = async () => {
    if (todayWorkout.length === 0 || !db || !userId) {
      showCustomAlert("今日訓練中沒有可儲存的項目。");
      return;
    }

    const planNameInput = prompt('請輸入新訓練計劃名稱：');
    if (!planNameInput) return;

    const newPlanData = {
      name: planNameInput,
      exercises: todayWorkout.map(w => ({
        exerciseId: w.exerciseId,
        name: w.exerciseName,
        category: w.category,
        muscle: w.muscle,
        details: w.details,
        type: w.type,
        advice: w.advice,
        imageUrl: w.imageUrl,
        weight: w.weight,
        sets: w.sets,
        reps: w.reps,
      })),
      createdDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      userId: userId,
    };

    try {
      const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/plans`), newPlanData);
      showCustomAlert('訓練計劃已儲存！');
    } catch (error) {
      console.error("儲存新計劃失敗:", error);
      showCustomAlert('儲存訓練計劃失敗。錯誤: ' + error.message);
    }
  };

  // 儲存今日訓練記錄到 Firestore
  const saveTodayWorkout = async () => {
    if (todayWorkout.length === 0 || !db || !userId) {
      showCustomAlert("今日訓練中沒有可儲存的項目。");
      return;
    }

    const completedWorkouts = todayWorkout.filter(w => w.completed && w.weight > 0 && w.sets > 0 && w.reps > 0);
    if (completedWorkouts.length === 0) {
      showCustomAlert('沒有已完成且有效的訓練項目可以儲存。');
      return;
    }

    const dateId = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    
    try {
      const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
      for (const workout of completedWorkouts) {
        const workoutToSave = {
          ...workout,
          recordDateId: dateId,
          userId: userId,
          id: undefined, // Firestore 會自動生成 ID，不需要傳入客戶端生成的 id
        };
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/workouts`), workoutToSave);
      }
      showCustomAlert('今日訓練已儲存！');
      setTodayWorkout([]); // 清空今日訓練列表
    } catch (error) {
      console.error("儲存今日訓練失敗:", error);
      showCustomAlert('儲存今日訓練失敗。錯誤: ' + error.message);
    }
  };

  // 獲取按日期分組的歷史訓練記錄
  const getHistoryByDate = () => {
    const grouped = {};
    workoutData.forEach(record => {
      // 確保 record.date 是有效日期字串
      const recordDateParts = record.date.split('/');
      let recordDateStr = record.date;
      if (recordDateParts.length === 3) {
          // 如果是 MM/DD/YYYY 格式，轉換為YYYY-MM-DD
          recordDateStr = `${recordDateParts[0]}/${recordDateParts[1]}/${recordDateParts[2]}`;
      }
      
      const dateKey = record.recordDateId || new Date(recordDateStr).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(record);
    });
    return grouped;
  };

  // 根據類別篩選動作列表
  const getFilteredExercises = (category) => {
    if (category) {
      return exercises.filter(ex => ex.category === category);
    }
    return exercises;
  };

  // 添加自訂動作到 Firestore
  const addCustomExercise = async () => {
    if (!newExerciseName || !newExerciseCategory || !db || !userId) {
      showCustomAlert("請填寫動作名稱和類別。");
      return;
    }

    const newExercise = {
      name: newExerciseName,
      category: newExerciseCategory,
      muscle: newExerciseCategory.toLowerCase(),
      details: newExerciseDetails,
      type: newExerciseType,
      advice: newExerciseAdvice,
      imageUrl: `https://placehold.co/100x100/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${encodeURIComponent(newExerciseName.substring(0,2))}`,
      userId: userId,
    };

    try {
      const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/exercises`), newExercise);
      setNewExerciseName('');
      setNewExerciseCategory('');
      setNewExerciseDetails('');
      setNewExerciseType('自由重量');
      setNewExerciseAdvice('');
      showCustomAlert('自訂動作已添加！');
    } catch (error) {
      console.error("添加自訂動作失敗:", error);
      showCustomAlert('添加自訂動作失敗。錯誤: ' + error.message);
    }
  };

  // 處理編輯訓練動作按鈕點擊，將數據載入表單
  const handleEditExercise = (exerciseToEdit) => {
    setNewExerciseName(exerciseToEdit.name);
    setNewExerciseCategory(exerciseToEdit.category);
    setNewExerciseDetails(exerciseToEdit.details || '');
    setNewExerciseType(exerciseToEdit.type || '自由重量');
    setNewExerciseAdvice(exerciseToEdit.advice || '');
    setEditExerciseId(exerciseToEdit.id);
  };

  // 儲存編輯後的訓練動作到 Firestore
  const saveEditedExercise = async () => {
    if (!editExerciseId || !db || !userId) {
      showCustomAlert("無法儲存編輯，請確認動作已選取。");
      return;
    }

    const updatedExerciseData = {
      name: newExerciseName,
      category: newExerciseCategory,
      muscle: newExerciseCategory.toLowerCase(),
      details: newExerciseDetails,
      type: newExerciseType,
      advice: newExerciseAdvice,
    };

    try {
      const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
      await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/exercises`, editExerciseId), updatedExerciseData);
      setNewExerciseName('');
      setNewExerciseCategory('');
      setNewExerciseDetails('');
      setNewExerciseType('自由重量');
      setNewExerciseAdvice('');
      setEditExerciseId(null);
      showCustomAlert('動作已更新！');
    } catch (error) {
      console.error("更新動作失敗:", error);
      showCustomAlert('更新動作失敗。錯誤: ' + error.message);
    }
  };

  // 從 Firestore 刪除訓練動作
  const deleteExercise = async (id) => {
    if (!db || !userId) return;
    // 更改為自訂彈窗
    showCustomAlert('確定要刪除這個動作嗎？此操作不可恢復。');
    // 這裡通常會結合一個確認彈窗，用戶點擊確認後才執行刪除
    // 目前為了快速測試，我們直接執行刪除，未來可以加入確認邏輯
    try {
        const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/exercises`, id));
        showCustomAlert('動作已刪除！');
    } catch (error) {
        console.error("刪除動作失敗:", error);
        showCustomAlert('刪除動作失敗。錯誤: ' + error.message);
    }
  };

  // 顯示動作詳情彈窗
  const showDetailModal = (exercise) => {
    setCurrentExerciseDetail(exercise);
    setAiAdviceContent('');
    setAiAdviceError('');
    setShowExerciseDetailModal(true);
  };

  // 將選中的動作加入當前正在創建的訓練計劃
  const addExerciseToCurrentPlan = () => {
    if (!selectedExerciseIdForPlan || planExerciseWeight === '' || planExerciseSets === '' || planExerciseReps === '') {
      showCustomAlert('請選擇動作並填寫所有預設值！');
      return;
    }

    const exercise = exercises.find(ex => ex.id === selectedExerciseIdForPlan);
    if (!exercise) return;

    const newPlanExercise = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9), // UI暫時唯一ID
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      category: exercise.category,
      muscle: exercise.muscle,
      weight: parseFloat(planExerciseWeight),
      sets: parseInt(planExerciseSets),
      reps: parseInt(planExerciseReps),
      details: exercise.details,
      type: exercise.type,
      advice: exercise.advice,
      imageUrl: exercise.imageUrl,
    };
    setCurrentPlanExercises([...currentPlanExercises, newPlanExercise]);
    setSelectedExerciseIdForPlan('');
    setPlanExerciseWeight('');
    setPlanExerciseSets('');
    setPlanExerciseReps('');
    showCustomAlert(`已將 "${exercise.name}" 加入當前計劃。`);
  };

  // 更新 currentPlanExercises 中動作的預設值
  const updateCurrentPlanExercise = (tempId, field, value) => {
    setCurrentPlanExercises(prevItems => prevItems.map(item =>
      item.id === tempId ? { ...item, [field]: field === 'weight' ? parseFloat(value) || 0 : parseInt(value) || 0 } : item
    ));
  };

  // 從 currentPlanExercises 中移除動作
  const removeExerciseFromCurrentPlan = (tempId) => {
    setCurrentPlanExercises(prevItems => prevItems.filter(item => item.id !== tempId));
  };

  // 創建新的訓練計劃並儲存到 Firestore
  const createWorkoutPlan = async () => {
    if (!planName || currentPlanExercises.length === 0 || !db || !userId) {
      showCustomAlert("請填寫計劃名稱並至少加入一個動作。");
      return;
    }

    const newPlanData = {
      name: planName,
      exercises: currentPlanExercises.map(item => ({
        exerciseId: item.exerciseId,
        name: item.exerciseName,
        category: item.category,
        muscle: item.muscle,
        weight: item.weight,
        sets: item.sets,
        reps: item.reps,
        details: item.details,
        type: item.type,
        advice: item.advice,
        imageUrl: item.imageUrl,
      })),
      createdDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      userId: userId,
    };

    try {
      const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/plans`), newPlanData);
      setPlanName('');
      setCurrentPlanExercises([]);
      setSelectedCategoryForPlan('');
      setSelectedExerciseIdForPlan('');
      showCustomAlert('訓練計劃已創建！');
    } catch (error) {
      console.error("創建訓練計劃失敗:", error);
      showCustomAlert('創建訓練計劃失敗。錯誤: ' + error.message);
    }
  };

  // 從 Firestore 刪除訓練計劃
  const deleteWorkoutPlan = async (id) => {
    if (!db || !userId) return;
    // 更改為自訂彈窗
    showCustomAlert('確定要刪除這個訓練計劃嗎？');
    // 目前直接執行刪除，未來可以加入確認邏輯
    try {
        const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/plans`, id));
        showCustomAlert('訓練計劃已刪除！');
    } catch (error) {
        console.error("刪除訓練計劃失敗:", error);
        showCustomAlert('刪除訓練計劃失敗。錯誤: ' + error.message);
    }
  };

  // 添加身體數據到 Firestore
  const addBodyStats = async () => {
    if (!bodyWeight || !db || !userId) {
      showCustomAlert("請填寫體重。");
      return;
    }

    const newStatsData = {
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      weight: parseFloat(bodyWeight),
      muscleWeight: muscleWeight ? parseFloat(muscleWeight) : null,
      fatWeight: fatWeight ? parseFloat(fatWeight) : null,
      bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : null,
      userId: userId,
    };

    try {
      const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/bodyStats`), newStatsData);
      setBodyWeight('');
      setMuscleWeight('');
      setFatWeight('');
      setBodyFatPercent('');
      showCustomAlert('身體數據已添加！');
    } catch (error) {
      console.error("添加身體數據失敗:", error);
      showCustomAlert('添加身體數據失敗。錯誤: ' + error.message);
    }
  };

  // 計算進度追蹤頁面所需的統計數據
  const getStats = () => {
    const now = new Date();
    let startDate = new Date();

    switch(statsView) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const filteredData = workoutData.filter(record => {
      const recordDateParts = record.date.split('/');
      let recordDate;
      if (recordDateParts.length === 3) {
          recordDate = new Date(`${recordDateParts[0]}-${recordDateParts[1]}-${recordDateParts[2]}`);
      } else {
          recordDate = new Date(record.date);
      }
      return recordDate >= startDate;
    });

    const muscleGroupSets = {};
    const categorySets = {};

    filteredData.forEach(record => {
      if (!muscleGroupSets[record.muscle]) {
        muscleGroupSets[record.muscle] = 0;
      }
      muscleGroupSets[record.muscle] += record.sets;

      if (!categorySets[record.category]) {
        categorySets[record.category] = 0;
      }
      categorySets[record.category] += record.sets;
    });

    const workoutDays = new Set(filteredData.map(record => record.date)).size;

    return {
      muscleGroupSets,
      categorySets,
      workoutDays,
      totalSets: filteredData.length > 0 ? filteredData.reduce((sum, record) => sum + record.sets, 0) : 0,
      completedExercises: filteredData.length
    };
  };

  const stats = getStats();

  // 處理用戶登出
  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      // 清空所有應用程式的本地數據狀態 (模擬完全登出，再次匿名登入會得到新的 UID)
      setWorkoutData([]);
      setExercises([]);
      setWorkoutPlans([]);
      setBodyStats([]);
      setTodayWorkout([]);
      setUserId(null); // 清空 userId
      setCurrentPage('daily');
      showCustomAlert('已成功登出。');
    } catch (error) {
      console.error("登出失敗:", error);
      showCustomAlert('登出失敗。錯誤: ' + error.message);
    }
  };

  // 獲取 AI 動作建議
  const getAiExerciseAdvice = async (exercise) => {
    setAiAdviceLoading(true);
    setAiAdviceContent('');
    setAiAdviceError('');
    try {
      const prompt = `請為健身動作 '${exercise.name}' 提供更多進階訓練建議、常見錯誤與修正方法、以及可以搭配的其他動作。請考量其屬於 '${exercise.category}' 類別，並且是 '${exercise.type}' 類型。原有的細節描述為：「${exercise.details}」，建議為：「${exercise.advice}」。請用繁體中文回答，內容清晰、條列分明，約200-300字。`;
      const response = await callGeminiApi(prompt);
      setAiAdviceContent(response);
    } catch (error) {
      setAiAdviceError('無法獲取 AI 建議，請稍後再試。');
      console.error('獲取 AI 建議失敗:', error);
    } finally {
      setAiAdviceLoading(false);
    }
  };

  // 生成 AI 訓練計劃
  const generateAiWorkoutPlan = async () => {
    setAiPlanLoading(true);
    setAiPlanGenerated(null);
    setAiPlanError('');

    if (!planFocus || !planDuration || !planGoal) {
      setAiPlanError('請填寫所有計劃生成選項（目標肌群、預計時長、訓練目標）。');
      setAiPlanLoading(false);
      return;
    }

    const availableExercises = exercises.filter(ex => planFocus === '全身' || ex.category === planFocus)
                                      .map(ex => ({
                                        id: ex.id,
                                        name: ex.name,
                                        category: ex.category,
                                        type: ex.type,
                                        muscle: ex.muscle
                                      }));
    if (availableExercises.length === 0) {
      setAiPlanError('您選擇的部位沒有可用的動作。請新增更多動作或選擇「全身」。');
      setAiPlanLoading(false);
      return;
    }

    const exerciseNames = availableExercises.map(ex => ex.name).join(', ');
    const schema = {
        type: "OBJECT",
        properties: {
            "planName": { "type": "STRING" },
            "exercises": {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "name": { "type": "STRING", "description": "必須精確匹配動作庫中的名稱" },
                        "weight": { "type": "NUMBER", "description": "預設合理重量，例如10-50之間" },
                        "sets": { "type": "NUMBER", "description": "預設3-5組" },
                        "reps": { "type": "NUMBER", "description": "預設8-15次" },
                        "notes": { "type": "STRING", "description": "每個動作的簡要說明或提示" }
                    },
                    required: ["name", "weight", "sets", "reps"]
                }
            },
            "description": { "type": "STRING", "description": "對此計劃的整體描述" }
        },
        required: ["planName", "exercises", "description"]
    };

    const prompt = `請根據以下條件生成一個詳細的訓練計劃。計劃中包含的動作名稱必須是來自以下我現有動作庫的確切名稱，不能創造不存在的動作。請為每個動作提供預設的重量（單位kg，請預設一個合理值，例如10-50之間，整數），組數（請預設3-5組，整數），次數（請預設8-15次，整數），並提供每個動作的簡要說明（notes）。請確保計劃內容清晰且易於執行。
我的動作庫包含的動作名稱有：${exerciseNames}。
目標肌群: ${planFocus}。
預計時長: ${planDuration}分鐘。
訓練目標: ${planGoal}。
請用繁體中文回應，並以嚴格的JSON格式回應，請嚴格遵守提供的 JSON Schema，並確保所有字段都存在。`;

    try {
      const response = await callGeminiApi(prompt, true, schema);
      // 驗證生成的計劃是否符合要求
      const validatedPlanExercises = response.exercises.filter(genEx => {
        const matchingExercise = exercises.find(ex => ex.name === genEx.name); // 修正這裡的變數名為 exercises
        return matchingExercise && typeof genEx.weight === 'number' && typeof genEx.sets === 'number' && typeof genEx.reps === 'number' && genEx.sets > 0 && genEx.reps > 0;
      }).map(genEx => {
        const originalEx = exercises.find(ex => ex.name === genEx.name); // 修正這裡的變數名為 exercises
        return {
          id: originalEx.id, // Use original exercise ID
          exerciseId: originalEx.id, // For compatibility with existing data structure
          exerciseName: originalEx.name,
          category: originalEx.category,
          muscle: originalEx.muscle,
          details: originalEx.details,
          type: originalEx.type,
          advice: originalEx.advice,
          imageUrl: originalEx.imageUrl,
          notes: genEx.notes || '', // Add notes from AI
        };
      });

      if (validatedPlanExercises.length === 0) {
        throw new Error("AI 生成的計劃無有效動作或格式不正確。");
      }
      
      setAiPlanGenerated({
        name: response.planName,
        description: response.description,
        exercises: validatedPlanExercises
      });

    } catch (error) {
      console.error('生成 AI 計劃失敗:', error);
      setAiPlanError(`生成訓練計劃失敗：${error.message || '格式不符或內容異常。'}`);
    } finally {
      setAiPlanLoading(false);
    }
  };

  // 將 AI 生成的計劃添加到我的訓練計劃
  const addAiPlanToMyPlans = async () => {
    if (!aiPlanGenerated || !db || !userId) return;

    const newPlanData = {
      name: aiPlanGenerated.name,
      exercises: aiPlanGenerated.exercises.map(ex => ({ // Ensure correct structure for Firestore
        exerciseId: ex.id, // Referencing original exercise ID
        name: ex.exerciseName,
        category: ex.category,
        muscle: ex.muscle,
        weight: ex.weight,
        sets: ex.sets,
        reps: ex.reps,
        details: ex.details,
        type: ex.type,
        advice: ex.advice,
        imageUrl: ex.imageUrl,
        notes: ex.notes,
      })),
      createdDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      description: aiPlanGenerated.description,
      userId: userId,
    };

    try {
      const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/plans`), newPlanData);
      setAiPlanGenerated(null); // Clear AI generated plan after saving
      showCustomAlert('AI 訓練計劃已成功添加到您的計劃列表！');
    } catch (error) {
      console.error("儲存 AI 計劃失敗:", error);
      showCustomAlert('儲存 AI 訓練計劃失敗。錯誤: ' + error.message);
    }
  };

  // 渲染底部導航欄
  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-10">
      <div className="flex justify-around">
        {[
          { key: 'daily', icon: Calendar, label: '今日訓練' },
          { key: 'exercises', icon: Dumbbell, label: '訓練動作' },
          { key: 'plans', icon: BarChart3, label: '訓練計劃' },
          { key: 'progress', icon: TrendingUp, label: '進度追蹤' },
          { key: 'timer', icon: Timer, label: '計時器' }
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setCurrentPage(key)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              currentPage === key
                ? 'text-blue-600 bg-blue-50' // 當前選中頁面的樣式
                : 'text-gray-600' // 未選中頁面的樣式
            }`}
          >
            <Icon size={20} />
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // 渲染「今日訓練」頁面內容
  const renderDailyWorkout = () => (
    <div className="p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">今日訓練記錄</h1>
        <button
          onClick={() => setShowDailyHistory(!showDailyHistory)}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Calendar size={24} />
        </button>
      </div>

      {showDailyHistory ? (
        // 訓練歷史記錄頁面
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setShowDailyHistory(false)}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold">訓練歷史</h2>
          </div>

          {Object.entries(getHistoryByDate())
            .sort(([dateA], [dateB]) => {
              const dateObjA = new Date(dateA); // 直接使用 dateA，它應該是YYYY-MM-DD 格式
              const dateObjB = new Date(dateB); // 直接使用 dateB
              return dateObjB.getTime() - dateObjA.getTime();
            })
            .map(([date, records]) => (
            <div key={date} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{date}</h3>
              <div className="space-y-2">
                {records.map((record, index) => ( // Added index for key to prevent console warning
                  <div key={record.id || index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">{record.exerciseName}</div>
                      <div className="text-sm text-gray-600">
                        {record.weight}kg × {record.sets}組 × {record.reps}次
                      </div>
                    </div>
                    <div className="text-green-600">✓</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 今日訓練主頁面
        <>
          {/* 選擇訓練計劃區域 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">選擇訓練計劃</h2>
            <div className="flex gap-3">
              <select
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedWorkoutPlan}
                onChange={(e) => setSelectedWorkoutPlan(e.target.value)}
                disabled={workoutPlans.length === 0} // 無計劃時禁用
              >
                <option value="">選擇已建立的訓練計劃</option>
                {workoutPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              <button
                onClick={loadWorkoutPlan}
                className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                disabled={!selectedWorkoutPlan || workoutPlans.length === 0}
              >
                載入
              </button>
            </div>
          </div>

          {/* 手動新增訓練區域 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">手動新增訓練</h2>

            <div className="space-y-4">
              {/* 部位選擇下拉選單 */}
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedExerciseId('');
                }}
                disabled={exercises.length === 0} // 數據未載入時禁用
              >
                <option value="">選擇訓練部位</option>
                {Array.from(new Set(exercises.map(ex => ex.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* 動作選擇下拉選單 (依據所選部位篩選) */}
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                disabled={!selectedCategory || getFilteredExercises(selectedCategory).length === 0} // 無動作或未選部位時禁用
              >
                <option value="">選擇訓練動作</option>
                {getFilteredExercises(selectedCategory).map(exercise => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>

              {/* 重量、組數、次數輸入框 */}
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="重量(kg)"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={exercises.length === 0 || !selectedExerciseId} // 無動作或未選動作時禁用
                />
                <input
                  type="number"
                  placeholder="組數"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  disabled={exercises.length === 0 || !selectedExerciseId} // 無動作或未選動作時禁用
                />
                <input
                  type="number"
                  placeholder="次數"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  disabled={exercises.length === 0 || !selectedExerciseId} // 無動作或未選動作時禁用
                />
              </div>

              {/* 新增記錄按鈕 */}
              <button
                onClick={addTodayWorkout}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                disabled={exercises.length === 0 || !selectedExerciseId || !weight || !sets || !reps} // 數據未載入時禁用
              >
                <Plus size={20} />
                新增記錄
              </button>
            </div>
          </div>

          {/* 今日訓練列表 (如果 todayWorkout 有內容則顯示) */}
          {todayWorkout.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">今日訓練菜單</h2>
                <div className="flex gap-2">
                  <button
                    onClick={saveAsNewPlan}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
                  >
                    存為計劃
                  </button>
                  <button
                    onClick={saveTodayWorkout}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    儲存
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {todayWorkout.map((record, index) => ( // Added index for key to prevent console warning
                  <div key={record.id || index} className={`p-4 rounded-lg border-2 transition-colors ${
                    record.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* 完成狀態核選框，編輯時隱藏 */}
                        {editExerciseId !== record.id && (
                          <input
                            type="checkbox"
                            checked={record.completed}
                            onChange={() => toggleCompleted(record.id)}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-gray-800">{record.exerciseName}</div>
                          <div className="text-sm text-gray-600">{record.category}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {/* 編輯/保存/取消按鈕 */}
                        {editExerciseId === record.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEditTodayWorkout(record.id)}
                              className="text-green-500 hover:text-green-700 p-1"
                            >
                              <CheckSquare size={20} />
                            </button>
                            <button
                              onClick={handleCancelEditTodayWorkout}
                              className="text-gray-500 hover:text-gray-700 p-1"
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditTodayWorkout(record.id)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteTodayWorkoutItem(record.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 重量、組數、次數輸入框，編輯時可輸入，否則禁用 */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">重量(kg)</label>
                        <input
                          type="number"
                          value={record.weight || ''}
                          onChange={(e) => updateWorkoutRecord(record.id, 'weight', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={editExerciseId !== record.id}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">組數</label>
                        <input
                          type="number"
                          value={record.sets || ''}
                          onChange={(e) => updateWorkoutRecord(record.id, 'sets', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={editExerciseId !== record.id}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">次數</label>
                        <input
                          type="number"
                          value={record.reps || ''}
                          onChange={(e) => updateWorkoutRecord(record.id, 'reps', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={editExerciseId !== record.id}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // 渲染「訓練動作」頁面內容
  const renderExercises = () => (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">訓練動作管理</h1>

      {/* 新增/編輯自訂動作區域 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editExerciseId ? '編輯動作' : '新增自訂動作'}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="動作名稱"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={newExerciseName}
            onChange={(e) => setNewExerciseName(e.target.value)}
          />

          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={newExerciseCategory}
            onChange={(e) => setNewExerciseCategory(e.target.value)}
          >
            <option value="">選擇部位</option>
            <option value="胸部">胸部</option>
            <option value="背部">背部</option>
            <option value="肩膀">肩膀</option>
            <option value="手臂">手臂</option>
            <option value="腿部">腿部</option>
            <option value="核心">核心</option>
            <option value="全身">全身</option>
            <option value="其他">其他</option>
          </select>

          <textarea
            placeholder="操作細節"
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={newExerciseDetails}
            onChange={(e) => setNewExerciseDetails(e.target.value)}
          ></textarea>

          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={newExerciseType}
            onChange={(e) => setNewExerciseType(e.target.value)}
          >
            <option value="自由重量">自由重量</option>
            <option value="器械">器械</option>
            <option value="徒手">徒手</option>
          </select>

          <textarea
            placeholder="訓練建議"
            rows="2"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={newExerciseAdvice}
            onChange={(e) => setNewExerciseAdvice(e.target.value)}
          ></textarea>

          {editExerciseId ? (
            // 編輯模式下的按鈕
            <button
              onClick={saveEditedExercise}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              儲存編輯
            </button>
          ) : (
            // 新增模式下的按鈕
            <button
              onClick={addCustomExercise}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              新增動作
            </button>
          )}
          {editExerciseId && (
            // 編輯模式下的取消按鈕
            <button
              onClick={() => {
                setEditExerciseId(null);
                setNewExerciseName('');
                setNewExerciseCategory('');
                setNewExerciseDetails('');
                setNewExerciseType('自由重量');
                setNewExerciseAdvice('');
              }}
              className="mt-2 w-full py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              <XCircle size={20} /> 取消編輯
            </button>
          )}
        </div>
      </div>

      {/* 動作列表 (按類別分組顯示) */}
      <div className="space-y-4">
        {Array.from(new Set(exercises.map(ex => ex.category))).map(category => (
          <div key={category} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">{category}</h3>
            <div className="grid grid-cols-1 gap-2">
              {exercises.filter(ex => ex.category === category).map(exercise => (
                <div key={exercise.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* 動作圖片，如果沒有則顯示名稱縮寫的佔位圖 */}
                    <img
                      src={exercise.imageUrl || `https://placehold.co/50x50/cccccc/ffffff?text=${encodeURIComponent(exercise.name.substring(0,2))}`}
                      alt={exercise.name}
                      className="w-12 h-12 rounded-md object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/50x50/cccccc/ffffff?text=圖片"; }}
                    />
                    <span className="text-gray-800 font-medium">{exercise.name}</span>
                  </div>
                  <div className="flex gap-2">
                    {/* 詳情、編輯、刪除按鈕 */}
                    <button
                      onClick={() => showDetailModal(exercise)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      <Info size={18} />
                    </button>
                    <button
                      onClick={() => handleEditExercise(exercise)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => deleteExercise(exercise.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 動作詳情彈窗 */}
      {showExerciseDetailModal && currentExerciseDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{currentExerciseDetail.name}</h3>
              <button
                onClick={() => setShowExerciseDetailModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={24} />
              </button>
            </div>
            {/* 動作圖片 */}
            <img
              src={currentExerciseDetail.imageUrl || `https://placehold.co/150x150/cccccc/ffffff?text=${encodeURIComponent(currentExerciseDetail.name)}`}
              alt={currentExerciseDetail.name}
              className="w-full h-32 object-cover rounded-lg mb-4"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x150/cccccc/ffffff?text=圖片"; }}
            />
            {/* 動作詳細資訊 */}
            <div className="space-y-3 text-gray-700">
              <p><strong>部位:</strong> {currentExerciseDetail.category}</p>
              <p><strong>類型:</strong> {currentExerciseDetail.type}</p>
              <p><strong>操作細節:</strong> {currentExerciseDetail.details}</p>
              <p><strong>訓練建議:</strong> {currentExerciseDetail.advice}</p>
            </div>

            {/* AI Advice Section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => getAiExerciseAdvice(currentExerciseDetail)}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                disabled={aiAdviceLoading}
              >
                {aiAdviceLoading ? '載入 AI 建議中...' : '✨獲取 AI 建議✨'}
              </button>
              {aiAdviceError && <p className="text-red-500 text-sm mt-2">{aiAdviceError}</p>}
              {aiAdviceContent && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-gray-800 text-sm whitespace-pre-wrap">
                  <h4 className="font-bold mb-2">AI 訓練洞察：</h4>
                  {aiAdviceContent}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染「訓練計劃」頁面內容
  const renderPlans = () => {
    const allCategories = Array.from(new Set(exercises.map(ex => ex.category)));

    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">訓練計劃</h1>

        {/* 創建新計劃區域 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">創建新計劃</h2>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="計劃名稱"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />

            {/* 選擇部位以篩選動作 */}
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedCategoryForPlan}
              onChange={(e) => {
                setSelectedCategoryForPlan(e.target.value);
                setSelectedExerciseIdForPlan('');
                setPlanExerciseWeight('');
                setPlanExerciseSets('');
                setPlanExerciseReps('');
              }}
              disabled={exercises.length === 0}
            >
              <option value="">選擇訓練部位</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <div className="space-y-3">
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedExerciseIdForPlan}
                onChange={(e) => setSelectedExerciseIdForPlan(e.target.value)}
                disabled={!selectedCategoryForPlan || getFilteredExercises(selectedCategoryForPlan).length === 0}
              >
                <option value="">選擇訓練動作</option>
                {getFilteredExercises(selectedCategoryForPlan).map(exercise => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
              
              {selectedExerciseIdForPlan && (
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    placeholder="重量(kg)"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={planExerciseWeight}
                    onChange={(e) => setPlanExerciseWeight(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="組數"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={planExerciseSets}
                    onChange={(e) => setPlanExerciseSets(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="次數"
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={planExerciseReps}
                    onChange={(e) => setPlanExerciseReps(e.target.value)}
                  />
                </div>
              )}

              <button
                onClick={addExerciseToCurrentPlan}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                disabled={!selectedExerciseIdForPlan || planExerciseWeight === '' || planExerciseSets === '' || planExerciseReps === '' || exercises.length === 0}
              >
                <PlusCircle size={20} />
                加入計劃動作
              </button>
            </div>

            {/* 當前計劃動作清單 */}
            {currentPlanExercises.length > 0 && (
              <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto bg-gray-50">
                <h3 className="text-md font-semibold mb-2 text-gray-700">計劃動作清單：</h3>
                <div className="space-y-3">
                  {currentPlanExercises.map((item, index) => (
                    <div key={item.id || index} className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-800">{item.exerciseName} ({item.category})</span>
                        <button
                          onClick={() => removeExerciseFromCurrentPlan(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">重量(kg)</label>
                          <input
                            type="number"
                            value={item.weight || ''}
                            onChange={(e) => updateCurrentPlanExercise(item.id, 'weight', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">組數</label>
                          <input
                            type="number"
                            value={item.sets || ''}
                            onChange={(e) => updateCurrentPlanExercise(item.id, 'sets', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-gray-700"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">次數</label>
                          <input
                            type="number"
                            value={item.reps || ''}
                            onChange={(e) => updateCurrentPlanExercise(item.id, 'reps', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-gray-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={createWorkoutPlan}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              disabled={!planName || currentPlanExercises.length === 0}
            >
              <Plus size={20} />
              創建計劃
            </button>
          </div>
        </div>

        {/* AI 訓練計劃生成器 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">✨AI 訓練計劃生成器✨</h2>
          <div className="space-y-4">
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={planFocus}
              onChange={(e) => setPlanFocus(e.target.value)}
              disabled={exercises.length === 0}
            >
              <option value="">選擇目標肌群</option>
              <option value="全身">全身</option>
              {allCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={planGoal}
              onChange={(e) => setPlanGoal(e.target.value)}
              disabled={exercises.length === 0}
            >
              <option value="增肌">增肌</option>
              <option value="減脂">減脂</option>
              <option value="耐力">耐力</option>
              <option value="維持健康">維持健康</option>
            </select>
            <input
              type="number"
              placeholder="預計時長 (分鐘)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={planDuration}
              onChange={(e) => setPlanDuration(e.target.value)}
              min="10"
              max="180"
              disabled={exercises.length === 0}
            />
            <button
              onClick={generateAiWorkoutPlan}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              disabled={aiPlanLoading || !planFocus || !planDuration || !planGoal || exercises.length === 0}
            >
              {aiPlanLoading ? '生成中...' : '✨生成 AI 訓練計劃✨'}
            </button>
            {aiPlanError && <p className="text-red-500 text-sm mt-2">{aiPlanError}</p>}

            {aiPlanGenerated && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-green-800 mb-2">生成計劃預覽: {aiPlanGenerated.name}</h3>
                <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{aiPlanGenerated.description}</p>
                <ul className="space-y-2">
                  {aiPlanGenerated.exercises.map((ex, index) => (
                    <li key={index} className="text-gray-800 text-sm">
                      • {ex.exerciseName}: {ex.weight}kg x {ex.sets}組 x {ex.reps}次
                      {ex.notes && <span className="text-gray-600"> ({ex.notes})</span>}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={addAiPlanToMyPlans}
                  className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircle size={20} /> 添加到我的計劃
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 已儲存的訓練計劃列表 */}
        {workoutPlans.length > 0 ? (
          <div className="space-y-4">
            {workoutPlans.map(plan => (
              <div key={plan.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{plan.name}</h3>
                  <span className="text-sm text-gray-500">{plan.createdDate}</span>
                </div>
                <div className="space-y-1 mb-3">
                  {plan.exercises.length > 0 ? (
                    plan.exercises.map((exercise, index) => ( // Added index for key to prevent console warning
                      <div key={exercise.exerciseId || index} className="text-sm text-gray-600">
                        • {exercise.name} ({exercise.category}) - 預設: {exercise.weight}kg x {exercise.sets}組 x {exercise.reps}次
                        {exercise.notes && <span className="text-gray-600"> ({exercise.notes})</span>}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">此計劃目前沒有動作。</div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => deleteWorkoutPlan(plan.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={18} /> 刪除計劃
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 p-8">
            <p>尚未建立任何訓練計劃。</p>
            <p>您可以在上方創建一個新計劃。</p>
          </div>
        )}
      </div>
    );
  };

  // 渲染「進度追蹤」頁面內容
  const renderProgress = () => (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">進度追蹤</h1>

      {/* 身體數據輸入區域 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">記錄身體數據</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <input
            type="number"
            placeholder="體重(kg)"
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={bodyWeight}
            onChange={(e) => setBodyWeight(e.target.value)}
          />
          <input
            type="number"
            placeholder="肌肉重(kg)"
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={muscleWeight}
            onChange={(e) => setMuscleWeight(e.target.value)}
          />
          <input
            type="number"
            placeholder="脂肪重(kg)"
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={fatWeight}
            onChange={(e) => setFatWeight(e.target.value)}
          />
          <input
            type="number"
            placeholder="體脂率(%)"
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={bodyFatPercent}
            onChange={(e) => setBodyFatPercent(e.target.value)}
          />
        </div>

        <button
          onClick={addBodyStats}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          disabled={!bodyWeight} // 體重為空時禁用
        >
          <Plus size={20} />
          記錄數據
        </button>
      </div>

      {/* 身體數據趨勢圖 (如果 bodyStats 有數據則顯示) */}
      {bodyStats.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">身體數據趨勢圖</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart
                data={bodyStats.slice().sort((a, b) => new Date(a.date) - new Date(b.date))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#8884d8" name="體重(kg)" />
                {bodyStats.some(d => d.muscleWeight !== null) && <Line type="monotone" dataKey="muscleWeight" stroke="#82ca9d" name="肌肉重(kg)" />}
                {bodyStats.some(d => d.fatWeight !== null) && <Line type="monotone" dataKey="fatWeight" stroke="#ffc658" name="脂肪重(kg)" />}
                {bodyStats.some(d => d.bodyFatPercent !== null) && <Line type="monotone" dataKey="bodyFatPercent" stroke="#ff7300" name="體脂率(%)" />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center text-gray-500">
          <p>沒有身體數據記錄可顯示圖表。</p>
        </div>
      )}

      {/* 統計視圖切換和數據展示 */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            {[
              { key: 'week', label: '週' },
              { key: 'month', label: '月' },
              { key: 'year', label: '年' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatsView(key)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  statsView === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 核心統計數據 */}
        {workoutData.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.workoutDays}</div>
              <div className="text-sm text-gray-600">總運動天數</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalSets}</div>
              <div className="text-sm text-gray-600">總訓練組數</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 mb-4">
            <p>沒有訓練記錄可顯示統計數據。</p>
          </div>
        )}

        {/* 部位訓練統計 (總組數) */}
        <h3 className="text-lg font-semibold mb-3">部位訓練統計 (總組數)</h3>
        {Object.keys(stats.categorySets).length > 0 ? (
          <div className="space-y-2 mb-6">
            {Object.entries(stats.categorySets).sort(([, a], [, b]) => b - a).map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium">{category}</span>
                    <span className="text-blue-600 font-semibold">{count} 組</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>本時段內沒有訓練記錄。</p>
              </div>
            )}
          </div>

          {/* 身體數據歷史列表 (如果 bodyStats 有數據則顯示) */}
          {bodyStats.length > 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3">身體數據記錄</h3>
              <div className="space-y-2">
                {bodyStats.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).map(stat => (
                  <div key={stat.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{stat.date}</span>
                      <div className="text-sm">
                        <span className="font-semibold">{stat.weight}kg</span>
                        {stat.muscleWeight !== null && (
                          <span className="ml-2 text-gray-600">肌肉重: {stat.muscleWeight}kg</span>
                        )}
                        {stat.fatWeight !== null && (
                          <span className="ml-2 text-gray-600">脂肪重: {stat.fatWeight}kg</span>
                        )}
                        {stat.bodyFatPercent !== null && (
                          <span className="ml-2 text-gray-600">體脂率: {stat.bodyFatPercent}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-500">
              <p>沒有身體數據記錄可顯示。</p>
            </div>
          )}
        </div>
      );

      // 渲染「計時器」頁面內容
      const renderTimer = () => (
        <div className="p-4 pb-20 bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-8 text-center">組間計時器</h1>

          <div className="bg-black rounded-xl shadow-lg p-8 text-center flex flex-col items-center max-w-sm mx-auto w-full">
            {/* 時間顯示，固定大小 */}
            <div className="flex justify-center items-center w-full mb-8 text-white font-bold text-7xl select-none">
              <span className="w-20 text-right">{timerHours.toString().padStart(2, '0')}</span>
              <span className="mx-1">:</span>
              <span className="w-20 text-center">{timerMinutes.toString().padStart(2, '0')}</span>
              <span className="mx-1">:</span>
              <span className="w-20 text-left">{timerSecondsInput.toString().padStart(2, '0')}</span>
            </div>

            {/* 時間滾輪輸入模擬 (使用 input 替代，帶有視覺樣式) */}
            <div className="flex justify-center items-center w-full mb-8 text-white text-5xl">
              <div className="relative w-24 h-40 overflow-hidden mx-1">
                <input
                  type="number"
                  className="absolute inset-0 bg-transparent border-none text-center w-full h-full text-white font-bold text-5xl appearance-none focus:outline-none focus:ring-0 cursor-grab"
                  value={timerHours.toString()}
                  onChange={(e) => {
                    if (!isTimerRunning) {
                      const val = parseInt(e.target.value);
                      setTimerHours(isNaN(val) ? 0 : Math.max(0, Math.min(23, val)));
                    }
                  }}
                  min="0" max="23"
                  disabled={isTimerRunning}
                  style={{
                    // 隱藏預設的數字滾輪箭頭
                    '-moz-appearance': 'textfield',
                    '&::-webkit-outer-spin-button': { '-webkit-appearance': 'none', margin: 0 },
                    '&::-webkit-inner-spin-button': { '-webkit-appearance': 'none', margin: 0 },
                    // 模擬滾輪效果，只顯示中間的數字
                    paddingTop: '3rem', // 模擬滾動空間
                    paddingBottom: '3rem', // 模擬滾動空間
                    lineHeight: '3rem', // 行高與文字大小匹配
                  }}
                />
                <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 border-t border-b border-gray-600 pointer-events-none"></div> {/* 中間選中條 */}
              </div>
              <span className="text-4xl text-gray-500">:</span>
              <div className="relative w-24 h-40 overflow-hidden mx-1">
                <input
                  type="number"
                  className="absolute inset-0 bg-transparent border-none text-center w-full h-full text-white font-bold text-5xl appearance-none focus:outline-none focus:ring-0 cursor-grab"
                  value={timerMinutes.toString()}
                  onChange={(e) => {
                    if (!isTimerRunning) {
                      const val = parseInt(e.target.value);
                      setTimerMinutes(isNaN(val) ? 0 : Math.max(0, Math.min(59, val)));
                    }
                  }}
                  min="0" max="59"
                  disabled={isTimerRunning}
                  style={{
                    '-moz-appearance': 'textfield',
                    '&::-webkit-outer-spin-button': { '-webkit-appearance': 'none', margin: 0 },
                    '&::-webkit-inner-spin-button': { '-webkit-appearance': 'none', margin: 0 },
                    paddingTop: '3rem',
                    paddingBottom: '3rem',
                    lineHeight: '3rem',
                  }}
                />
                <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 border-t border-b border-gray-600 pointer-events-none"></div>
              </div>
              <span className="text-4xl text-gray-500">:</span>
              <div className="relative w-24 h-40 overflow-hidden mx-1">
                <input
                  type="number"
                  className="absolute inset-0 bg-transparent border-none text-center w-full h-full text-white font-bold text-5xl appearance-none focus:outline-none focus:ring-0 cursor-grab"
                  value={timerSecondsInput.toString()}
                  onChange={(e) => {
                    if (!isTimerRunning) {
                      const val = parseInt(e.target.value);
                      setTimerSecondsInput(isNaN(val) ? 0 : Math.max(0, Math.min(59, val)));
                    }
                  }}
                  min="0" max="59"
                  disabled={isTimerRunning}
                  style={{
                    '-moz-appearance': 'textfield',
                    '&::-webkit-outer-spin-button': { '-webkit-appearance': 'none', margin: 0 },
                    '&::-webkit-inner-spin-button': { '-webkit-appearance': 'none', margin: 0 },
                    paddingTop: '3rem',
                    paddingBottom: '3rem',
                    lineHeight: '3rem',
                  }}
                />
                <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 border-t border-b border-gray-600 pointer-events-none"></div>
              </div>
            </div>

            {/* 控制按鈕 (開始/暫停, 重置) */}
            <div className="flex justify-center gap-4 mt-4 mb-8 w-full">
              <button
                onClick={() => {
                  if (timerDisplaySeconds === 0 && !isTimerRunning) {
                    showCustomAlert("請設定計時器時間。");
                    return;
                  }
                  setIsTimerRunning(!isTimerRunning);
                }}
                className={`w-32 h-32 rounded-full flex items-center justify-center text-white font-semibold text-2xl transition-all transform active:scale-95 duration-150 shadow-lg 
                  ${isTimerRunning
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                  }`}
              >
                {isTimerRunning ? <Pause size={48} /> : <Play size={48} className="translate-x-1" />}
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerHours(0);
                  setTimerMinutes(1);
                  setTimerSecondsInput(30);
                  setTimerDisplaySeconds(90); // 重置為預設 1分30秒
                }}
                className="w-32 h-32 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center font-semibold text-2xl hover:bg-gray-600 transition-all transform active:scale-95 duration-150 shadow-lg"
              >
                <RotateCcw size={36} />
              </button>
            </div>

            {/* 快速設定時間按鈕 */}
            <div className="mt-8 w-full text-center">
              <div className="text-sm text-gray-400 mb-3">快速設定</div>
              <div className="flex justify-center gap-2 flex-wrap">
                {[30, 60, 90, 120, 180, 240, 300].map(seconds => (
                  <button
                    key={seconds}
                    onClick={() => {
                      if (!isTimerRunning) {
                        setTimerHours(Math.floor(seconds / 3600));
                        setTimerMinutes(Math.floor((seconds % 3600) / 60));
                        setTimerSecondsInput(seconds % 60);
                        setTimerDisplaySeconds(seconds);
                      }
                    }}
                    className="px-4 py-2 bg-gray-800 text-blue-400 rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold transform active:scale-95 duration-150 border border-gray-600"
                    disabled={isTimerRunning}
                  >
                    {formatTime(seconds)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

      // 主應用程式渲染邏輯
      if (isLoading || !isAuthReady) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="text-2xl font-semibold text-indigo-700">載入中，請稍候...</div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
          <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
            <div className="flex justify-end p-4 bg-white"> {/* 確保頂部欄有背景色 */}
              {userId && (
                <div className="mr-4 text-sm text-gray-500 break-all flex items-center">
                  用戶 ID: <span className="font-mono text-gray-700 ml-1">{userId.substring(0, 8)}...</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                登出
              </button>
            </div>
            {currentPage === 'daily' && renderDailyWorkout()}
            {currentPage === 'exercises' && renderExercises()}
            {currentPage === 'plans' && renderPlans()}
            {currentPage === 'progress' && renderProgress()}
            {currentPage === 'timer' && renderTimer()}

            {renderBottomNav()}
          </div>
          {showAlertModal && <AlertModal message={alertMessage} onClose={() => setShowAlertModal(false)} />}
        </div>
      );
    };

    export default WorkoutApp;
    