<template>
  <div class="wheel-container">
    <Dialog v-model:visible="visible" modal header="Wheel of Decision" :style="{ width: '50vw' }">
      <div class="wheel-content">
        <canvas ref="wheelCanvas" width="400" height="400"></canvas>
        <div class="wheel-controls">
          <Button label="Spin" @click="spinWheel" :disabled="isSpinning" />
          <Button label="Reset" @click="resetWheel" class="p-button-secondary ml-2" />
          <div class="mt-3">
            <span class="font-bold">Selected: </span>
            <span>{{ selectedName || 'Spin the wheel!' }}</span>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useSocketStore } from '../stores/socket';

const visible = ref(false);
const wheelCanvas = ref(null);
const isSpinning = ref(false);
const selectedName = ref('');
const socketStore = useSocketStore();

let ctx;
let startAngle = 0;
let spinTimeout = null;
let spinAngleStart;
let spinTime = 0;
let spinTimeTotal = 0;

const colors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
  '#9966FF', '#FF9F40', '#FF6384', '#36A2EB'
];

function drawWheel() {
  if (!wheelCanvas.value || !ctx) return;
  
  const names = socketStore.connectedUsers;
  if (!names.length) return;

  ctx.clearRect(0, 0, 400, 400);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  
  ctx.font = 'bold 12px Arial';
  
  const arc = Math.PI * 2 / names.length;
  
  for(let i = 0; i < names.length; i++) {
    const angle = startAngle + i * arc;
    ctx.fillStyle = colors[i % colors.length];
    
    ctx.beginPath();
    ctx.arc(200, 200, 190, angle, angle + arc, false);
    ctx.arc(200, 200, 0, angle + arc, angle, true);
    ctx.stroke();
    ctx.fill();
    
    // Draw the names
    ctx.save();
    ctx.fillStyle = "white";
    ctx.translate(200, 200);
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = "right";
    ctx.fillText(names[i], 180, 0);
    ctx.restore();
  }
  
  // Draw the arrow
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.moveTo(200 - 4, 200 - (190 + 5));
  ctx.lineTo(200 + 4, 200 - (190 + 5));
  ctx.lineTo(200, 200 - (190 - 5));
  ctx.closePath();
  ctx.fill();
}

function spin() {
  spinAngleStart = Math.random() * 10 + 10;
  spinTime = 0;
  spinTimeTotal = Math.random() * 3 + 4 * 1000;
  rotateWheel();
}

function rotateWheel() {
  spinTime += 30;
  if(spinTime >= spinTimeTotal) {
    stopRotateWheel();
    return;
  }
  
  const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
  startAngle += (spinAngle * Math.PI / 180);
  drawWheel();
  spinTimeout = setTimeout(rotateWheel, 30);
}

function stopRotateWheel() {
  clearTimeout(spinTimeout);
  const degrees = startAngle * 180 / Math.PI + 90;
  const arcd = 360 / socketStore.connectedUsers.length;
  const index = Math.floor((360 - degrees % 360) / arcd);
  selectedName.value = socketStore.connectedUsers[index];
  isSpinning.value = false;
}

function easeOut(t, b, c, d) {
  const ts = (t/=d)*t;
  const tc = ts*t;
  return b+c*(tc + -3*ts + 3*t);
}

function spinWheel() {
  if (isSpinning.value) return;
  isSpinning.value = true;
  selectedName.value = '';
  spin();
}

function resetWheel() {
  clearTimeout(spinTimeout);
  startAngle = 0;
  selectedName.value = '';
  isSpinning.value = false;
  drawWheel();
}

onMounted(() => {
  if (wheelCanvas.value) {
    ctx = wheelCanvas.value.getContext('2d');
    drawWheel();
  }
});

watch(() => socketStore.connectedUsers, () => {
  drawWheel();
}, { deep: true });

defineExpose({
  show: () => visible.value = true
});
</script>

<style scoped>
.wheel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wheel-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.wheel-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>
