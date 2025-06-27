import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Dumbbell, Calendar, TrendingUp, Timer, Save, Trash2, Play, Pause, RotateCcw, ChevronLeft, ChevronRight, BarChart3, Info, Edit, CheckSquare, XCircle, Settings, PlusCircle, LogIn, LogOut, UserPlus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const App = () => {
  // 認證狀態
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // 新增狀態來切換登入/註冊表單
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    // 初始化一個預設帳號，用於演示。實際應用應從後端載入。
    return [{ username: 'user', password: 'password' }];
  });

  const [currentPage, setCurrentPage] = useState('daily');
  const [workoutData, setWorkoutData] = useState([]);
  const [exercises, setExercises] = useState([
    { id: 1, name: '槓鈴臥推', category: '胸部', muscle: 'chest', details: '平躺於臥推椅，雙手握住槓鈴略寬於肩，將槓鈴下放至胸部上方，然後推起。', type: '自由重量', advice: '保持核心穩定，感受胸肌發力。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Barbell%20Press' },
    { id: 2, name: '啞鈴臥推', category: '胸部', muscle: 'chest', details: '平躺於臥推椅，雙手各持一個啞鈴，將啞鈴下放至胸部兩側，然後推起。', type: '自由重量', advice: '控制啞鈴下放速度，保持平衡。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Dumbbell%20Press' },
    { id: 3, name: '上斜臥推', category: '胸部', muscle: 'chest', details: '調整臥推椅至上斜角度，雙手握住槓鈴或啞鈴，將其推起。', type: '自由重量', advice: '上斜臥推主要鍛鍊上胸。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Incline%20Press' },
    { id: 4, name: '飛鳥', category: '胸部', muscle: 'chest', details: '使用啞鈴或繩索，雙臂向兩側打開，再向中間夾緊，感受胸肌收縮。', type: '自由重量/器械', advice: '保持微屈肘，不要鎖死關節。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Fly' },
    { id: 5, name: '雙槓撐體', category: '胸部', muscle: 'chest', details: '雙手握住雙槓，身體下降至最低點，然後推起。', type: '自由重量', advice: '身體前傾可更多刺激胸部。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Dips' },
    
    { id: 6, name: '引體向上', category: '背部', muscle: 'back', details: '雙手握住單槓，向上拉起身體直到下巴過槓。', type: '自由重量', advice: '感受背部肌肉發力，而不是手臂。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Pull%20Up' },
    { id: 7, name: '槓鈴划船', category: '背部', muscle: 'back', details: '俯身，雙手握住槓鈴，將槓鈴拉向腹部。', type: '自由重量', advice: '保持背部挺直，避免弓背。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Barbell%20Row' },
    { id: 8, name: '啞鈴划船', category: '背部', muscle: 'back', details: '單手持啞鈴，另一手扶住長凳，將啞鈴拉向身體。', type: '自由重量', advice: '緩慢控制，感受背闊肌的收縮。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Dumbbell%20Row' },
    { id: 9, name: '滑輪下拉', category: '背部', muscle: 'back', details: '坐在器械上，雙手握住把手，將把手拉向胸部。', type: '器械', advice: '多用背部發力，而非手臂。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Lat%20Pulldown' },
    { id: 10, name: '硬舉', category: '背部', muscle: 'back', details: '雙腳與肩同寬，俯身握住槓鈴，使用腿部和臀部力量將槓鈴拉起。', type: '自由重量', advice: '是複合動作，注意動作標準性。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Deadlift' },

    { id: 11, name: '肩推', category: '肩膀', muscle: 'shoulders', details: '坐姿或站姿，雙手持槓鈴或啞鈴，向上推舉過頭。', type: '自由重量/器械', advice: '保持核心收緊，避免過度仰臥。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Shoulder%20Press' },
    { id: 12, name: '側平舉', category: '肩膀', muscle: 'shoulders', details: '雙手持啞鈴，雙臂向身體兩側抬起，直到與肩同高。', type: '自由重量', advice: '感受肩部側束發力，不要藉助慣性。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Lateral%20Raise' },
    { id: 13, name: '前平舉', category: '肩膀', muscle: 'shoulders', details: '雙手向前抬起，直到與肩同高。', type: '自由重量', advice: '主要鍛鍊肩部前束。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Front%20Raise' },
    { id: 14, name: '後束飛鳥', category: '肩膀', muscle: 'shoulders', details: '俯身，雙手持啞鈴，向兩側抬起，感受肩部後束收縮。', type: '自由重量/器械', advice: '針對肩部後束，動作幅度不需過大。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Rear%20Delt%20Fly' },
    { id: 15, name: '聳肩', category: '肩膀', muscle: 'shoulders', details: '雙手持啞鈴或槓鈴，向上聳肩。', type: '自由重量', advice: '主要鍛鍊斜方肌。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Shrugs' },

    { id: 16, name: '二頭彎舉', category: '手臂', muscle: 'arms', details: '站姿或坐姿，雙手持啞鈴或槓鈴，向上彎舉，感受二頭肌收縮。', type: '自由重量', advice: '手肘固定，只移動前臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Bicep%20Curl' },
    { id: 17, name: '三頭下壓', category: '手臂', muscle: 'arms', details: '使用繩索或直槓，雙手向下壓動，感受三頭肌收縮。', type: '器械', advice: '保持大臂不動，只移動小臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Tricep%20Pushdown' },
    { id: 18, name: '錘式彎舉', category: '手臂', 'muscle': 'arms', details: '雙手持啞鈴，掌心相對，向上彎舉。', type: '自由重量', advice: '刺激二頭肌和前臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Hammer%20Curl' },
    { id: 19, name: '三頭伸展', category: '手臂', muscle: 'arms', details: '使用啞鈴或繩索，將手臂向後或向上伸展，感受三頭肌收縮。', type: '自由重量/器械', advice: '動作頂端充分收縮三頭肌。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Tricep%20Extension' },
    { id: 20, name: '窄握推舉', category: '手臂', muscle: 'arms', details: '平躺於臥推椅，雙手窄握槓鈴，將槓鈴下放至胸部上方，然後推起。', type: '自由重量', advice: '主要鍛鍊三頭肌。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Close%20Grip%20Press' },

    { id: 21, name: '深蹲', category: '腿部', muscle: 'legs', details: '雙腳與肩同寬，背部挺直，屈膝下蹲，大腿與地面平行後站起。', type: '自由重量', advice: '保持核心穩定，膝蓋不要內扣。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Squat' },
    { id: 22, name: '腿推', category: '腿部', muscle: 'legs', details: '坐在腿推機上，將雙腿推起，感受大腿肌肉收縮。', type: '器械', advice: '膝蓋不要完全鎖死。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Leg%20Press' },
    { id: 23, name: '腿屈伸', category: '腿部', muscle: 'legs', details: '坐在腿屈伸機上，伸展膝蓋，感受大腿前側肌肉收縮。', type: '器械', 'advice': '緩慢控制，頂端稍作停留。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Leg%20Extension' },
    { id: 24, name: '腿後彎舉', category: '腿部', muscle: 'legs', details: '俯臥或坐姿在腿後彎舉機上，彎曲膝蓋，感受大腿後側肌肉收縮。', type: '器械', advice: '充分收縮腿後腱肌。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Hamstring%20Curl' },
    { id: 25, name: '提踵', category: '腿部', muscle: 'legs', details: '站立，腳尖著地，向上提起腳跟，感受小腿肌肉收縮。', type: '自由重量/器械', advice: '頂端充分收縮小腿。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Calf%20Raise' },

    { id: 26, name: '仰臥起坐', category: '核心', muscle: 'core', details: '平躺，雙手抱頭或交叉放胸前，向上捲腹。', type: '自由重量', advice: '不要用脖子發力，感受腹肌收縮。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Sit%20Up' },
    { id: 27, name: '棒式', category: '核心', muscle: 'core', details: '俯臥撐姿勢，用手肘和腳尖支撐身體，保持身體一條直線。', type: '自由重量', advice: '保持核心收緊，臀部不要下塌。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Plank' },
    { id: 28, name: '俄羅斯轉體', category: '核心', muscle: 'core', details: '坐姿，雙腿抬起，身體向左右轉動，雙手可持重物。', type: '自由重量', advice: '感受腹斜肌的收縮。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Russian%20Twist' },
    { id: 29, 'name': '腹部輪', category: '核心', muscle: 'core', details: '跪姿，雙手握住腹部輪，向前滾動，然後收回。', type: '器械', advice: '保持背部平直，核心收緊。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Ab%20Wheel' },
    { id: 30, name: '懸垂舉腿', category: '核心', muscle: 'core', details: '雙手握住單槓懸垂，向上抬起雙腿。', type: '自由重量', advice: '感受下腹部發力。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Hanging%20Leg%20Raise' }
  ]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [bodyStats, setBodyStats] = useState([]);

  // 計時器狀態
  const [timerSeconds, setTimerSeconds] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState(90);
  const timerIntervalRef = useRef(null);
  const timerCanvasRef = useRef(null);
  const isDraggingRef = useRef(false);

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

  // 身體數據狀態
  const [bodyWeight, setBodyWeight] = useState('');
  const [muscleWeight, setMuscleWeight] = useState('');
  const [fatWeight, setFatWeight] = useState('');
  const [bodyFatPercent, setBodyFatPercent] = useState('');

  // 統計視圖狀態
  const [statsView, setStatsView] = useState('month');

  // 計算圓形碼錶拖拉角度
  const getAngle = (e, rect) => {
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  };

  // 圓形碼錶開始拖拉
  const handleMouseDown = useCallback((e) => {
    isDraggingRef.current = true;
    const canvas = timerCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const angle = getAngle(e, rect);
    const maxSeconds = 30 * 60;
    let newSeconds = Math.round((angle / 360) * maxSeconds / 10) * 10;
    if (newSeconds === 0) newSeconds = maxSeconds;
    setTimerSeconds(newSeconds);
    setTimerDisplay(newSeconds);
  }, []);

  // 圓形碼錶拖拉中
  const handleMouseMove = useCallback((e) => {
    if (isDraggingRef.current && timerCanvasRef.current && !isTimerRunning) {
      const canvas = timerCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const angle = getAngle(e, rect);
      const maxSeconds = 30 * 60;
      let newSeconds = Math.round((angle / 360) * maxSeconds / 10) * 10;
      if (newSeconds === 0) newSeconds = maxSeconds;
      setTimerSeconds(newSeconds);
      setTimerDisplay(newSeconds);
    }
  }, [isTimerRunning]);

  // 圓形碼錶結束拖拉
  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // 繪製圓形碼錶
  const drawTimer = useCallback(() => {
    const canvas = timerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // 調整半徑，為拖拉點留出更多空間，避免被切到
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除畫布

    // 繪製背景圓
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#ccc';
    ctx.stroke();

    // 繪製進度條
    const maxSeconds = 30 * 60;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * (timerDisplay / maxSeconds));
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineWidth = 15;
    ctx.strokeStyle = timerDisplay <= 10 && isTimerRunning ? '#EF4444' : '#3B82F6';
    ctx.stroke();

    // 繪製拖拉點
    if (!isTimerRunning) {
      const handleRadius = 15; // 拖拉點半徑
      const handleAngle = startAngle + (2 * Math.PI * (timerSeconds / maxSeconds));
      const handleX = centerX + radius * Math.cos(handleAngle);
      const handleY = centerY + radius * Math.sin(handleAngle);
      ctx.beginPath();
      ctx.arc(handleX, handleY, handleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#3B82F6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // 繪製時間文字
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.fillStyle = '#1F2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatTime(timerDisplay), centerX, centerY);
  }, [timerDisplay, timerSeconds, isTimerRunning]);

  // 計時器效果
  useEffect(() => {
    if (isTimerRunning && timerDisplay > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerDisplay(time => time - 1);
      }, 1000);
    } else if (timerDisplay === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      clearInterval(timerIntervalRef.current);
      alert('休息時間結束！');
    } else if (!isTimerRunning && timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning, timerDisplay]);

  // 監聽timerSeconds或timerDisplay變化，重繪碼錶
  useEffect(() => {
    drawTimer();
  }, [timerSeconds, timerDisplay, isTimerRunning, drawTimer]);

  // 設置Canvas寬高以適應容器
  useEffect(() => {
    const canvas = timerCanvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientWidth;
        drawTimer();
      }
    }
  }, [currentPage, drawTimer]);

  // 格式化時間顯示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 添加今日訓練記錄
  const addTodayWorkout = () => {
    if (!selectedExerciseId || !weight || !sets || !reps) return;

    const exercise = exercises.find(ex => ex.id === parseInt(selectedExerciseId));
    if (!exercise) return;

    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      exerciseId: parseInt(selectedExerciseId),
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
    };

    setTodayWorkout([...todayWorkout, newRecord]);

    setSelectedExerciseId('');
    setWeight('');
    setSets('');
    setReps('');
  };

  // 從訓練計劃載入動作
  const loadWorkoutPlan = () => {
    if (!selectedWorkoutPlan) return;

    const plan = workoutPlans.find(p => p.id === parseInt(selectedWorkoutPlan));
    if (!plan) return;

    const planWorkouts = plan.exercises.map(exercise => ({
      id: Date.now() + Math.random(),
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      exerciseId: exercise.id,
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
    }));

    setTodayWorkout(planWorkouts);
    setSelectedWorkoutPlan('');
  };

  // 編輯今日訓練記錄
  const handleEditTodayWorkout = (id) => {
    setEditExerciseId(id);
  };

  // 確認編輯
  const handleSaveEditTodayWorkout = (id) => {
    setEditExerciseId(null);
  };

  // 取消編輯
  const handleCancelEditTodayWorkout = () => {
    setEditExerciseId(null);
  };

  // 刪除今日訓練項目
  const deleteTodayWorkoutItem = (id) => {
    setTodayWorkout(todayWorkout.filter(workout => workout.id !== id));
  };

  // 切換完成狀態
  const toggleCompleted = (id) => {
    setTodayWorkout(todayWorkout.map(workout => 
      workout.id === id ? { ...workout, completed: !workout.completed } : workout
    ));
  };

  // 更新訓練記錄
  const updateWorkoutRecord = (id, field, value) => {
    setTodayWorkout(todayWorkout.map(workout => 
      workout.id === id ? { ...workout, [field]: field === 'weight' ? parseFloat(value) || 0 : parseInt(value) || 0 } : workout
    ));
  };

  // 儲存為新的訓練計劃
  const saveAsNewPlan = () => {
    if (todayWorkout.length === 0) return;

    const planName = prompt('請輸入新訓練計劃名稱：');
    if (!planName) return;

    const newPlan = {
      id: Date.now(),
      name: planName,
      exercises: todayWorkout.map(w => ({
        id: w.exerciseId,
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
      createdDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    };

    setWorkoutPlans([...workoutPlans, newPlan]);
    alert('訓練計劃已儲存！');
  };

  // 儲存今日訓練
  const saveTodayWorkout = () => {
    if (todayWorkout.length === 0) return;

    const completedWorkouts = todayWorkout.filter(w => w.completed && w.weight > 0 && w.sets > 0 && w.reps > 0);
    const dateId = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    const newWorkoutEntries = completedWorkouts.map(w => ({ ...w, recordDateId: dateId }));

    setWorkoutData([...workoutData, ...newWorkoutEntries]);

    alert('今日訓練已儲存！');
    setTodayWorkout([]);
  };

  // 獲取歷史訓練記錄（按日期分組）
  const getHistoryByDate = () => {
    const grouped = {};
    workoutData.forEach(record => {
      if (!grouped[record.recordDateId]) {
        grouped[record.recordDateId] = [];
      }
      grouped[record.recordDateId].push(record);
    });
    return grouped;
  };

  // 獲取過濾後的動作列表
  const getFilteredExercises = (category) => {
    if (category) {
      return exercises.filter(ex => ex.category === category);
    }
    return exercises;
  };

  // 添加自訂動作
  const addCustomExercise = () => {
    if (!newExerciseName || !newExerciseCategory) return;

    const newExercise = {
      id: Date.now(),
      name: newExerciseName,
      category: newExerciseCategory,
      muscle: newExerciseCategory.toLowerCase(),
      details: newExerciseDetails,
      type: newExerciseType,
      advice: newExerciseAdvice,
      imageUrl: `https://placehold.co/100x100/${Math.floor(Math.random()*16777215).toString(16)}/ffffff?text=${encodeURIComponent(newExerciseName.substring(0,2))}`,
    };

    setExercises([...exercises, newExercise]);
    setNewExerciseName('');
    setNewExerciseCategory('');
    setNewExerciseDetails('');
    setNewExerciseType('自由重量');
    setNewExerciseAdvice('');
  };

  // 編輯訓練動作
  const handleEditExercise = (exerciseToEdit) => {
    setNewExerciseName(exerciseToEdit.name);
    setNewExerciseCategory(exerciseToEdit.category);
    setNewExerciseDetails(exerciseToEdit.details || '');
    setNewExerciseType(exerciseToEdit.type || '自由重量');
    setNewExerciseAdvice(exerciseToEdit.advice || '');
    setEditExerciseId(exerciseToEdit.id);
  };

  // 儲存編輯後的訓練動作
  const saveEditedExercise = () => {
    setExercises(exercises.map(ex =>
      ex.id === editExerciseId
        ? {
            ...ex,
            name: newExerciseName,
            category: newExerciseCategory,
            muscle: newExerciseCategory.toLowerCase(),
            details: newExerciseDetails,
            type: newExerciseType,
            advice: newExerciseAdvice,
          }
        : ex
    ));
    setNewExerciseName('');
    setNewExerciseCategory('');
    setNewExerciseDetails('');
    setNewExerciseType('自由重量');
    setNewExerciseAdvice('');
    setEditExerciseId(null);
  };

  // 刪除訓練動作
  const deleteExercise = (id) => {
    if (window.confirm('確定要刪除這個動作嗎？此操作不可恢復。')) {
      setExercises(exercises.filter(ex => ex.id !== id));
      setWorkoutPlans(workoutPlans.map(plan => ({
        ...plan,
        exercises: plan.exercises.filter(ex => ex.id !== id)
      })).filter(plan => plan.exercises.length > 0));
    }
  };

  // 顯示動作詳情
  const showDetailModal = (exercise) => {
    setCurrentExerciseDetail(exercise);
    setShowExerciseDetailModal(true);
  };

  // 將選中的動作加入當前正在編輯的訓練計劃
  const addExerciseToCurrentPlan = () => {
    if (!selectedExerciseIdForPlan || planExerciseWeight === '' || planExerciseSets === '' || planExerciseReps === '') {
      alert('請選擇動作並填寫所有預設值！');
      return;
    }

    const exercise = exercises.find(ex => ex.id === parseInt(selectedExerciseIdForPlan));
    if (!exercise) return;

    const newPlanExercise = {
      id: Date.now() + Math.random(),
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
  };

  // 更新 currentPlanExercises 中的動作細節
  const updateCurrentPlanExercise = (id, field, value) => {
    setCurrentPlanExercises(currentPlanExercises.map(item =>
      item.id === id ? { ...item, [field]: field === 'weight' ? parseFloat(value) || 0 : parseInt(value) || 0 } : item
    ));
  };

  // 從 currentPlanExercises 中移除動作
  const removeExerciseFromCurrentPlan = (id) => {
    setCurrentPlanExercises(currentPlanExercises.filter(item => item.id !== id));
  };

  // 創建訓練計劃
  const createWorkoutPlan = () => {
    if (!planName || currentPlanExercises.length === 0) return;

    const newPlan = {
      id: Date.now(),
      name: planName,
      exercises: currentPlanExercises.map(item => ({
        id: item.exerciseId,
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
      createdDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
    };

    setWorkoutPlans([...workoutPlans, newPlan]);
    setPlanName('');
    setCurrentPlanExercises([]);
    setSelectedCategoryForPlan('');
    setSelectedExerciseIdForPlan('');
    alert('訓練計劃已創建！');
  };

  // 刪除訓練計劃
  const deleteWorkoutPlan = (id) => {
    if (window.confirm('確定要刪除這個訓練計劃嗎？')) {
      setWorkoutPlans(workoutPlans.filter(plan => plan.id !== id));
    }
  };

  // 添加身體數據
  const addBodyStats = () => {
    if (!bodyWeight) return;

    const newStats = {
      id: Date.now(),
      date: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      weight: parseFloat(bodyWeight),
      muscleWeight: muscleWeight ? parseFloat(muscleWeight) : null,
      fatWeight: fatWeight ? parseFloat(fatWeight) : null,
      bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : null
    };

    setBodyStats([...bodyStats, newStats]);
    setBodyWeight('');
    setMuscleWeight('');
    setFatWeight('');
    setBodyFatPercent('');
  };

  // 計算統計數據
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

  // 處理登入
  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = registeredUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (foundUser) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('使用者名稱或密碼錯誤');
    }
  };

  // 處理註冊
  const handleRegister = (e) => {
    e.preventDefault();
    if (username.length < 3 || password.length < 3) {
      setLoginError('使用者名稱和密碼至少需要3個字元');
      return;
    }
    const userExists = registeredUsers.some(u => u.username === username);
    if (userExists) {
      setLoginError('此使用者名稱已被註冊');
      return;
    }
    setRegisteredUsers([...registeredUsers, { username, password }]);
    setLoginError('註冊成功！請登入。');
    setIsRegistering(false); // 註冊成功後切換回登入頁面
    setUsername(''); // 清空輸入欄位
    setPassword('');
  };

  // 處理登出
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError(''); // 清除任何先前的登入/註冊錯誤
    // 注意：由於目前資料儲存於記憶體，登出會導致所有資料（包括新註冊的用戶）在頁面重新整理後消失。
    // 如需持久化資料和用戶帳號，請務必使用 Firebase 或其他後端服務。
    // 我們在這裡也將預設動作重設，以模擬不同用戶的體驗。
    setWorkoutData([]);
    setExercises([
        { id: 1, name: '槓鈴臥推', category: '胸部', muscle: 'chest', details: '平躺於臥推椅，雙手握住槓鈴略寬於肩，將槓鈴下放至胸部上方，然後推起。', type: '自由重量', advice: '保持核心穩定，感受胸肌發力。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Barbell%20Press' },
        { id: 2, name: '啞鈴臥推', category: '胸部', muscle: 'chest', details: '平躺於臥推椅，雙手各持一個啞鈴，將啞鈴下放至胸部兩側，然後推起。', type: '自由重量', advice: '控制啞鈴下放速度，保持平衡。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Dumbbell%20Press' },
        { id: 3, name: '上斜臥推', category: '胸部', muscle: 'chest', details: '調整臥推椅至上斜角度，雙手握住槓鈴或啞鈴，將其推起。', type: '自由重量', advice: '上斜臥推主要鍛鍊上胸。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Incline%20Press' },
        { id: 4, name: '飛鳥', category: '胸部', muscle: 'chest', details: '使用啞鈴或繩索，雙臂向兩側打開，再向中間夾緊，感受胸肌收縮。', type: '自由重量/器械', advice: '保持微屈肘，不要鎖死關節。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Fly' },
        { id: 5, name: '雙槓撐體', category: '胸部', muscle: 'chest', details: '雙手握住雙槓，身體下降至最低點，然後推起。', type: '自由重量', advice: '身體前傾可更多刺激胸部。', imageUrl: 'https://placehold.co/100x100/A78BFA/ffffff?text=Dips' },
        
        { id: 6, name: '引體向上', category: '背部', muscle: 'back', details: '雙手握住單槓，向上拉起身體直到下巴過槓。', type: '自由重量', advice: '感受背部肌肉發力，而不是手臂。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Pull%20Up' },
        { id: 7, name: '槓鈴划船', category: '背部', muscle: 'back', details: '俯身，雙手握住槓鈴，將槓鈴拉向腹部。', type: '自由重量', advice: '保持背部挺直，避免弓背。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Barbell%20Row' },
        { id: 8, name: '啞鈴划船', category: '背部', muscle: 'back', details: '單手持啞鈴，另一手扶住長凳，將啞鈴拉向身體。', type: '自由重量', advice: '緩慢控制，感受背闊肌的收縮。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Dumbbell%20Row' },
        { id: 9, name: '滑輪下拉', category: '背部', muscle: 'back', details: '坐在器械上，雙手握住把手，將把手拉向胸部。', type: '器械', advice: '多用背部發力，而非手臂。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Lat%20Pulldown' },
        { id: 10, name: '硬舉', category: '背部', muscle: 'back', details: '雙腳與肩同寬，俯身握住槓鈴，使用腿部和臀部力量將槓鈴拉起。', type: '自由重量', advice: '是複合動作，注意動作標準性。', imageUrl: 'https://placehold.co/100x100/6D28D9/ffffff?text=Deadlift' },

        { id: 11, name: '肩推', category: '肩膀', muscle: 'shoulders', details: '坐姿或站姿，雙手持槓鈴或啞鈴，向上推舉過頭。', type: '自由重量/器械', advice: '保持核心收緊，避免過度仰臥。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Shoulder%20Press' },
        { id: 12, name: '側平舉', category: '肩膀', muscle: 'shoulders', details: '雙手持啞鈴，雙臂向身體兩側抬起，直到與肩同高。', type: '自由重量', advice: '感受肩部側束發力，不要藉助慣性。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Lateral%20Raise' },
        { id: 13, name: '前平舉', category: '肩膀', muscle: 'shoulders', details: '雙手向前抬起，直到與肩同高。', type: '自由重量', advice: '主要鍛鍊肩部前束。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Front%20Raise' },
        { id: 14, name: '後束飛鳥', category: '肩膀', muscle: 'shoulders', details: '俯身，雙手持啞鈴，向兩側抬起，感受肩部後束收縮。', type: '自由重量/器械', advice: '針對肩部後束，動作幅度不需過大。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Rear%20Delt%20Fly' },
        { id: 15, name: '聳肩', category: '肩膀', muscle: 'shoulders', details: '雙手持啞鈴或槓鈴，向上聳肩。', type: '自由重量', advice: '主要鍛鍊斜方肌。', imageUrl: 'https://placehold.co/100x100/4F46E5/ffffff?text=Shrugs' },

        { id: 16, name: '二頭彎舉', category: '手臂', muscle: 'arms', details: '站姿或坐姿，雙手持啞鈴或槓鈴，向上彎舉，感受二頭肌收縮。', type: '自由重量', advice: '手肘固定，只移動前臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Bicep%20Curl' },
        { id: 17, name: '三頭下壓', category: '手臂', muscle: 'arms', details: '使用繩索或直槓，雙手向下壓動，感受三頭肌收縮。', type: '器械', advice: '保持大臂不動，只移動小臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Tricep%20Pushdown' },
        { id: 18, name: '錘式彎舉', category: '手臂', 'muscle': 'arms', details: '雙手持啞鈴，掌心相對，向上彎舉。', type: '自由重量', advice: '刺激二頭肌和前臂。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Hammer%20Curl' },
        { id: 19, name: '三頭伸展', category: '手臂', muscle: 'arms', details: '使用啞鈴或繩索，將手臂向後或向上伸展，感受三頭肌收縮。', type: '自由重量/器械', advice: '動作頂端充分收縮三頭肌。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Tricep%20Extension' },
        { id: 20, name: '窄握推舉', category: '手臂', muscle: 'arms', details: '平躺於臥推椅，雙手窄握槓鈴，將槓鈴下放至胸部上方，然後推起。', type: '自由重量', advice: '主要鍛鍊三頭肌。', imageUrl: 'https://placehold.co/100x100/F59E0B/ffffff?text=Close%20Grip%20Press' },

        { id: 21, name: '深蹲', category: '腿部', muscle: 'legs', details: '雙腳與肩同寬，背部挺直，屈膝下蹲，大腿與地面平行後站起。', type: '自由重量', advice: '保持核心穩定，膝蓋不要內扣。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Squat' },
        { id: 22, name: '腿推', category: '腿部', muscle: 'legs', details: '坐在腿推機上，將雙腿推起，感受大腿肌肉收縮。', type: '器械', advice: '膝蓋不要完全鎖死。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Leg%20Press' },
        { id: 23, name: '腿屈伸', category: '腿部', muscle: 'legs', details: '坐在腿屈伸機上，伸展膝蓋，感受大腿前側肌肉收縮。', type: '器械', 'advice': '緩慢控制，頂端稍作停留。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Leg%20Extension' },
        { id: 24, name: '腿後彎舉', category: '腿部', muscle: 'legs', details: '俯臥或坐姿在腿後彎舉機上，彎曲膝蓋，感受大腿後側肌肉收縮。', type: '器械', advice: '充分收縮腿後腱肌。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Hamstring%20Curl' },
        { id: 25, name: '提踵', category: '腿部', muscle: 'legs', details: '站立，腳尖著地，向上提起腳跟，感受小腿肌肉收縮。', type: '自由重量/器械', advice: '頂端充分收縮小腿。', imageUrl: 'https://placehold.co/100x100/10B981/ffffff?text=Calf%20Raise' },

        { id: 26, name: '仰臥起坐', category: '核心', muscle: 'core', details: '平躺，雙手抱頭或交叉放胸前，向上捲腹。', type: '自由重量', advice: '不要用脖子發力，感受腹肌收縮。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Sit%20Up' },
        { id: 27, name: '棒式', category: '核心', muscle: 'core', details: '俯臥撐姿勢，用手肘和腳尖支撐身體，保持身體一條直線。', type: '自由重量', advice: '保持核心收緊，臀部不要下塌。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Plank' },
        { id: 28, name: '俄羅斯轉體', category: '核心', muscle: 'core', details: '坐姿，雙腿抬起，身體向左右轉動，雙手可持重物。', type: '自由重量', advice: '感受腹斜肌的收縮。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Russian%20Twist' },
        { id: 29, 'name': '腹部輪', category: '核心', muscle: 'core', details: '跪姿，雙手握住腹部輪，向前滾動，然後收回。', type: '器械', advice: '保持背部平直，核心收緊。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Ab%20Wheel' },
        { id: 30, name: '懸垂舉腿', category: '核心', muscle: 'core', details: '雙手握住單槓懸垂，向上抬起雙腿。', type: '自由重量', advice: '感受下腹部發力。', imageUrl: 'https://placehold.co/100x100/EF4444/ffffff?text=Hanging%20Leg%20Raise' }
    ]);
    setWorkoutPlans([]);
    setBodyStats([]);
  };

  // 渲染底部導航
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
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // 渲染今日訓練頁面
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
        // 歷史記錄頁面
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
            .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
            .map(([date, records]) => (
            <div key={date} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">{date}</h3>
              <div className="space-y-2">
                {records.map(record => (
                  <div key={record.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
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
        // 主要訓練頁面
        <>
          {/* 選擇訓練計劃 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">選擇訓練計劃</h2>
            <div className="flex gap-3">
              <select
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedWorkoutPlan}
                onChange={(e) => setSelectedWorkoutPlan(e.target.value)}
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
              >
                載入
              </button>
            </div>
          </div>

          {/* 手動新增訓練 */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">手動新增訓練</h2>

            <div className="space-y-4">
              {/* 部位選擇 */}
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedExerciseId('');
                }}
              >
                <option value="">選擇訓練部位</option>
                {Array.from(new Set(exercises.map(ex => ex.category))).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* 動作選擇 */}
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                disabled={!selectedCategory}
              >
                <option value="">選擇訓練動作</option>
                {getFilteredExercises(selectedCategory).map(exercise => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-3">
                <input
                  type="number"
                  placeholder="重量(kg)"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="組數"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="次數"
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                />
              </div>

              <button
                onClick={addTodayWorkout}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                新增記錄
              </button>
            </div>
          </div>

          {/* 今日訓練列表 */}
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
                {todayWorkout.map(record => (
                  <div key={record.id} className={`p-4 rounded-lg border-2 transition-colors ${
                    record.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
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

  // 渲染訓練動作頁面
  const renderExercises = () => (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">訓練動作管理</h1>

      {/* 新增/編輯自訂動作 */}
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
            <button
              onClick={saveEditedExercise}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              儲存編輯
            </button>
          ) : (
            <button
              onClick={addCustomExercise}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              新增動作
            </button>
          )}
        </div>
      </div>

      {/* 動作列表 */}
      <div className="space-y-4">
        {Array.from(new Set(exercises.map(ex => ex.category))).map(category => (
          <div key={category} className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">{category}</h3>
            <div className="grid grid-cols-1 gap-2">
              {exercises.filter(ex => ex.category === category).map(exercise => (
                <div key={exercise.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={exercise.imageUrl || `https://placehold.co/50x50/cccccc/ffffff?text=${encodeURIComponent(exercise.name.substring(0,2))}`}
                      alt={exercise.name}
                      className="w-12 h-12 rounded-md object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/50x50/cccccc/ffffff?text=圖片"; }}
                    />
                    <span className="text-gray-800 font-medium">{exercise.name}</span>
                  </div>
                  <div className="flex gap-2">
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
            <img
              src={currentExerciseDetail.imageUrl || `https://placehold.co/150x150/cccccc/ffffff?text=${encodeURIComponent(currentExerciseDetail.name)}`}
              alt={currentExerciseDetail.name}
              className="w-full h-32 object-cover rounded-lg mb-4"
              onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/150x150/cccccc/ffffff?text=圖片"; }}
            />
            <div className="space-y-3 text-gray-700">
              <p><strong>部位:</strong> {currentExerciseDetail.category}</p>
              <p><strong>類型:</strong> {currentExerciseDetail.type}</p>
              <p><strong>操作細節:</strong> {currentExerciseDetail.details}</p>
              <p><strong>訓練建議:</strong> {currentExerciseDetail.advice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染訓練計劃頁面
  const renderPlans = () => (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">訓練計劃</h1>

      {/* 創建新計劃 */}
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

          {/* Category Selection for Plan */}
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
          >
            <option value="">選擇訓練部位</option>
            {Array.from(new Set(exercises.map(ex => ex.category))).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Exercise Selection for Plan and Input for details */}
          <div className="space-y-3">
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedExerciseIdForPlan}
              onChange={(e) => setSelectedExerciseIdForPlan(e.target.value)}
              disabled={!selectedCategoryForPlan}
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
              disabled={!selectedExerciseIdForPlan || planExerciseWeight === '' || planExerciseSets === '' || planExerciseReps === ''}
            >
              <PlusCircle size={20} />
              加入計劃動作
            </button>
          </div>

          {/* Current Plan Exercises List */}
          {currentPlanExercises.length > 0 && (
            <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto bg-gray-50">
              <h3 className="text-md font-semibold mb-2 text-gray-700">計劃動作清單：</h3>
              <div className="space-y-3">
                {currentPlanExercises.map(item => (
                  <div key={item.id} className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
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

      {/* Existing Plans */}
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
                  plan.exercises.map(exercise => (
                    <div key={exercise.id} className="text-sm text-gray-600">
                      • {exercise.name} ({exercise.category}) - 預設: {exercise.weight}kg x {exercise.sets}組 x {exercise.reps}次
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

  // 渲染進度追蹤頁面
  const renderProgress = () => (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">進度追蹤</h1>

      {/* 身體數據輸入 */}
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
        >
          <Plus size={20} />
          記錄數據
        </button>
      </div>

      {/* Body Stats Trend Chart */}
      {bodyStats.length > 0 && (
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
      )}

      {/* Stats View Toggle */}
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

        {/* Stats Display */}
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

        {/* Muscle Group Training Stats */}
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

      {/* Body Stats History */}
      {bodyStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3">身體數據記錄</h3>
          <div className="space-y-2">
            {bodyStats.slice().sort((a,b) => new Date(b.date) - new Date(a.date)).map(stat => (
              <div key={stat.id} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{stat.date}</span>
                  <div className="text-sm">
                    <span className="font-semibold">{stat.weight}kg</span>
                    {stat.bodyFatPercent && (
                      <span className="ml-2 text-gray-600">體脂率: {stat.bodyFatPercent}%</span>
                    )}
                     {stat.muscleWeight && (
                      <span className="ml-2 text-gray-600">肌肉重: {stat.muscleWeight}kg</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 渲染計時器頁面
  const renderTimer = () => (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">組間計時器</h1>

      <div className="bg-white rounded-xl shadow-lg p-8 text-center flex flex-col items-center">
        {/* 計時器顯示 - Canvas圓形碼錶 */}
        <div className="relative w-64 h-64 mb-8">
          <canvas
            ref={timerCanvasRef}
            width="256"
            height="256"
            className="w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => { e.persist(); handleMouseDown(e.touches[0]); }}
            onTouchMove={(e) => { e.persist(); handleMouseMove(e.touches[0]); }}
            onTouchEnd={handleMouseUp}
            onTouchCancel={handleMouseUp}
          ></canvas>
        </div>

        {/* 控制按鈕 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => {
              setIsTimerRunning(!isTimerRunning);
            }}
            className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-colors transform active:scale-95 duration-150 shadow-lg ${
              isTimerRunning
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isTimerRunning ? <Pause size={24} /> : <Play size={24} />}
            {isTimerRunning ? '暫停' : '開始'}
          </button>

          <button
            onClick={() => {
              setIsTimerRunning(false);
              setTimerDisplay(timerSeconds);
            }}
            className="px-8 py-4 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors transform active:scale-95 duration-150 shadow-lg flex items-center gap-2"
          >
            <RotateCcw size={24} />
            重置
          </button>
        </div>

        {/* 快速設定按鈕 */}
        <div className="mt-8">
          <div className="text-sm text-gray-600 mb-3">快速設定</div>
          <div className="flex justify-center gap-2 flex-wrap">
            {[30, 60, 90, 120, 180, 240, 300].map(seconds => (
              <button
                key={seconds}
                onClick={() => {
                  if (!isTimerRunning) {
                    setTimerSeconds(seconds);
                    setTimerDisplay(seconds);
                  }
                }}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold transform active:scale-95 duration-150"
                disabled={isTimerRunning}
              >
                {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // 認證頁面渲染 (包含登入與註冊)
  const renderAuthPage = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">歡迎使用健身追蹤器</h1>
        {isRegistering ? (
          // 註冊表單
          <>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">註冊帳號</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="設定使用者名稱 (至少3個字元)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="設定密碼 (至少3個字元)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                註冊
              </button>
            </form>
            <p className="mt-4 text-gray-600">
              已有帳號？{' '}
              <button
                onClick={() => { setIsRegistering(false); setLoginError(''); setUsername(''); setPassword(''); }}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                前往登入
              </button>
            </p>
          </>
        ) : (
          // 登入表單
          <>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">登入</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="使用者名稱 (預設: user)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="密碼 (預設: password)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                登入
              </button>
            </form>
            <p className="mt-4 text-gray-600">
              沒有帳號？{' '}
              <button
                onClick={() => { setIsRegistering(true); setLoginError(''); setUsername(''); setPassword(''); }}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                立即註冊
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans">
      {!isLoggedIn ? (
        renderAuthPage() // 根據登入狀態渲染登入/註冊頁面或主應用程式
      ) : (
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
          <div className="flex justify-end p-4">
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
      )}
    </div>
  );
};

export default App;

