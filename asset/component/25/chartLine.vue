<template>
  <div class="echart-box" :id="id" :style="'height: ' + height + 'px;'"></div>
</template>
<script type="text/javascript">
import echarts from 'echarts'
import { v4 as uuid } from 'uuid'
export default {
  data() {
    return {
      chart: null,
      id: '',
    }
  },
  props: {
    option: {
      type: Object,
      default: function() {
        return {}
      }
    },
    height: {
      type: Number,
      default: 240
    }
  },
  created() {
    this.id = uuid()
  },
  mounted () {
    this.$nextTick(() => {
      this.chart = echarts.init(document.getElementById(this.id))
      this.chart.setOption(this.option)
    })
  },
  methods: {
  }
}
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
</style>
