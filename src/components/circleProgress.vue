<template>
  <div class="percentloop" ref="percentloop">
    <div class="circle-left">
      <div ref="leftcontent"></div>
    </div>
    <div class="circle-right" :style="{background: progress >= 70 ? 'linear-gradient(180deg, rgba(#04c086, .6), #04c086)' : progress >= 40 ? 'linear-gradient(180deg, rgba(#FF9000, .6), #FF9000)' : 'linear-gradient(180deg, rgba(#FF0620, .6), #FF0620)'}">
      <div ref="rightcontent"></div>
    </div>
    <div class="internal">
      <slot></slot>
    </div>
  </div>
</template>
 
<script setup>
import { ref, reactive, onMounted, defineProps, watch } from "vue";
const props = defineProps({
  percentNum: {
    type: [String, Number],
    required: false,
    default: 0,
  },

  speed: {
    type: [String, Number],
    required: false,
    default: 3,
  },

  size: {
    type: [String, Number],
    required: false,
    default: 1.6,
  },
});
 
const data = reactive({
  percent: 0,
  initDeg: 0,
  timeId: null,
  animationing: false,
});
 
// 获取dom元素
const percentloop = ref(null);
const leftcontent = ref(null);
const rightcontent = ref(null);
const progress = ref(100)
 
const methods = reactive({
  transformToDeg(percent) {
    let deg = 0;
    if (percent >= 100) {
      deg = 360;
    } else {
      deg = parseInt((360 * percent) / 100);
    }
    return deg;
  },
  transformToPercent(deg) {
    let percent = 0;
    if (deg >= 360) {
      percent = 100;
    } else {
      percent = parseInt((100 * deg) / 360);
    }
    return percent;
  },
  rotateLeft(deg) {
    // 大于180时，执行的动画
    if (leftcontent.value?.style)
      leftcontent.value.style.transform = "rotate(" + (deg - 180) + "deg)";
  },
  rotateRight(deg) {
    // 小于180时，执行的动画
    if (rightcontent.value?.style)
      rightcontent.value.style.transform = "rotate(" + deg + "deg)";
  },
  goRotate(deg) {
    data.animationing = true;
    data.timeId = setInterval(() => {
      if (deg > data.initDeg) {
        // 递增动画
        data.initDeg += Number(props.speed);
        if (data.initDeg >= 180) {
          methods.rotateLeft(data.initDeg);
          methods.rotateRight(180); // 为避免前后两次传入的百分比转换为度数后的值不为步距的整数，可能出现的左右转动不到位的情况。
        } else {
          methods.rotateRight(data.initDeg);
        }
      } else {
        // 递减动画
        data.initDeg -= Number(props.speed);
        if (data.initDeg >= 180) {
          methods.rotateLeft(data.initDeg);
        } else {
          methods.rotateLeft(180); // 为避免前后两次传入的百分比转换为度数后的值不为步距的整数，可能出现的左右转动不到位的情况。
          methods.rotateRight(data.initDeg);
        }
      }
      data.percent = methods.transformToPercent(data.initDeg); // 百分比数据滚动动画
      const remainer = Number(deg) - data.initDeg;
      if (Math.abs(remainer) < props.speed) {
        data.initDeg += remainer;
        if (data.initDeg > 180) {
          methods.rotateLeft(deg);
        } else {
          methods.rotateRight(deg);
        }
        methods.animationFinished();
      }
    }, 10);
  },
  animationFinished() {
    data.percent = props.percentNum; // 百分比数据滚动动画
    data.animationing = false;
    clearInterval(data.timeId);
  },
});
 
onMounted(() => {
  methods.goRotate(methods.transformToDeg(props.percentNum));
  percentloop.value.style.height = props.size + "rem";
  percentloop.value.style.width = props.size + "rem";
});
watch(() => props.percentNum, (val) => {
  console.log(val)
  if (data.animationing) {
    if (val != progress.value) {
      setTimeout(() => {
        methods.goRotate(methods.transformToDeg(val));
        progress.value = val
      }, 1000)
    }
    return
  }
  methods.goRotate(methods.transformToDeg(val));
  progress.value = val
});
</script>
 
<style scoped lang="scss">
.percentloop {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  .circle-left,
  .circle-right {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    // 设置进度条颜色
    background: linear-gradient(180deg, rgba(#04c086, .6), #04c086);
    overflow: hidden;
    & > div {
      width: 100%;
      height: 100%;
      background-color: rgb(255, 234, 234);
      transform-origin: right center;
    }
  }
  .circle-right {
    left: 50%;
    & > div {
      transform-origin: left center;
    }
  }
  .internal {
    position: absolute;
    // 设置进度条宽度
    top: 6%;
    bottom: 6%;
    left: 6%;
    right: 6%;
    background-color: rgb(255, 234, 234);
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>