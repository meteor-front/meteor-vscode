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
        return {
          color: ['#4653EA', '#1BBA66'],
          grid: {
            top: '8%',
            bottom: '12%'
          },
          tooltip: {
              trigger: 'axis',
              axisPointer: {
                  type: 'shadow'
              }
          },
            xAxis: {
                type: 'category',
                data: ['产量', '销售', '发运', '库存']
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: [120, 100, 150, 80],
                type: 'bar',
                barWidth: '15px'
            }, {
                data: [120, 200, 150, 80],
                type: 'bar',
                barWidth: '15px'
            }]
        }
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
