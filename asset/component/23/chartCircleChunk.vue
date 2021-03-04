<template>
  <div class="chart-box">
    <div :id="id"></div>
  </div>
</template>
<script type="text/javascript">
import { Canvas } from '@antv/g-canvas'
import { v4 as uuid } from 'uuid'

export default {
  data() {
    return {
      chart: {},
      ordinateList: [],
      dataInner: [],
      chartIndex: 1,
      x: 0,
      y: 0,
      id: ''
    }
  },
  created() {
    this.id = uuid()
  },
  props: {
    height: {
      type: Number,
      default: 260
    },
    width: {
      type: Number,
      default: 450
    },
    title: {
      type: String,
      default: ''
    },
    outRadius: {
      type: Number,
      default: 100
    },
    inRadius: {
      type: Number,
      default: 50
    },
    active: {
      type: Number,
      default: 0
    },
    data: {
      type: Array,
      default: function() {
        return []
      }
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.renderOxideMain(this.id, this.data.length, this.active)
    })
  },
  methods: {
    getPoint(angle, offset, radius) {
      if (0 <= angle && angle < 90) {
       return [Math.sin(angle / 180 * Math.PI) * radius + offset.x, - Math.cos(angle / 180 * Math.PI) * radius + offset.y]
      } else if (90 <= angle && angle < 180) {
       return [Math.cos((angle - 90) / 180 * Math.PI) * radius + offset.x, Math.sin((angle - 90) / 180 * Math.PI) * radius + offset.y]
      } else if (180 <= angle && angle < 270) {
       return [- Math.sin((angle - 180) / 180 * Math.PI) * radius + offset.x, Math.cos((angle - 180) / 180 * Math.PI) * radius + offset.y]
      } else if (270 <= angle && angle <= 360) {
       return [- Math.sin((360 - angle) / 180 * Math.PI) * radius + offset.x, - Math.cos((360 - angle) / 180 * Math.PI) * radius + offset.y]
      }
    },
    getPointList(sideCount, offset, radius) {
      let point = []
      if (sideCount > 0) {
        let angle = 360 / sideCount
        for (let i = 0; i < sideCount; i++) {
          point.push(this.getPoint(i * angle, offset, radius))
        }
      }
      return point
    },
    addText(x, y, text, size, color) {
      this.chart.addShape('text', {
        attrs: {
          x: x,
          y: y,
          fontFamily: 'PingFang SC',
          text: text,
          fontSize: size,
          fill: color
        }
      })
    },
    renderOxideMain(container, sideCount, active) {
      this.chart = new Canvas({
        container: container,
        width: this.width,
        height: this.height,
      });
      this.x = this.width / 2
      this.y = this.height / 2
      // 标题
      if (this.title.includes('#')) {
        let titleArr = this.title.split('#')
        this.addText(this.x - titleArr[0].length * 10, this.y, titleArr[0], 20, '#4A4A4A')
        this.addText(this.x - titleArr[1].length * 10, this.y + 30, titleArr[1], 20, '#4A4A4A')
      } else {
        this.addText(this.x - this.title.length * 10, this.y + 15, this.title, 20, '#4A4A4A')
      }
      this.ordinateList = this.getPointList(sideCount, {
        x: this.x,
        y: this.y
      }, this.outRadius)
      this.dataInner = this.getPointList(sideCount, {
        x: this.x,
        y: this.y
      }, this.inRadius)
      for (let i = 0; i < this.data.length; i++) {
        let angle = 360 / sideCount
        if (active !== i) {
          this.renderItem(angle, i, false, container, sideCount, this.data[i])
        }
      }
      this.renderItem(360 / sideCount, active, true, container, sideCount, this.data[active])
    },
    renderItem(angle, index, active, container, sideCount, item) {
      let angleItem = angle * index
      let angleOffset = angle * index - 5 > 0 ? angle * index : 0
      let oxideBegin = this.ordinateList[index];
      let oxideBeginInner = this.dataInner[index]
      let oxideEnd = []
      let oxideEndInner = []
      if (index < this.ordinateList.length - 1) {
        oxideEnd = this.ordinateList[index + 1];
        oxideEndInner = this.dataInner[index + 1]
        if (active) {
          oxideEnd = this.getPoint(angle * (index + 1), {
            x: this.x,
            y: this.y
          }, this.outRadius * 1.1)
        }
      } else {
        oxideEnd = this.ordinateList[0];
        oxideEndInner = this.dataInner[0]
        if (active) {
          oxideEnd = this.getPoint(0, {
            x: this.x,
            y: this.y
          }, this.outRadius * 1.1)
        }
      }
      if (active) {
        oxideBegin = this.getPoint(angleOffset, {
          x: this.x,
          y: this.y
        }, this.outRadius * 1.1)
        oxideBeginInner = this.getPoint(angleOffset, {
          x: this.x,
          y: this.y
        }, this.inRadius)
      }
      let path = `m ${oxideBeginInner[0]} ${oxideBeginInner[1]} l ${oxideBegin[0] - oxideBeginInner[0]} ${oxideBegin[1] - oxideBeginInner[1]} l ${oxideEnd[0] - oxideBegin[0]} ${oxideEnd[1] - oxideBegin[1]} l ${oxideEndInner[0] - oxideEnd[0]} ${oxideEndInner[1] - oxideEnd[1]} z`
      this.renderOxide(path, '#fff', item.status === 'normal' ? '#1BBA66' : '#FB0102', container, sideCount, index)
      this.renderTitle(angleItem, (oxideEnd[0] + oxideBegin[0]) / 2, (oxideEnd[1] + oxideBegin[1]) / 2, item.title, item.value)
    },
    renderOxide(path, stroke, fill, container, sideCount, index) {
      let vm = this
      const pathOxide = this.chart.addShape('path', {
        attrs: {
          path: path,
          lineWidth: 2,
          stroke: stroke || '#fff',
          fill: fill || '#1BBA66',
          container,
          sideCount,
          index,
          cursor: 'pointer'
        }
      })
      pathOxide.on('click', function() {
        document.getElementById('oxideMain').innerHTML = ''
        vm.chartIndex = this.attrs.index
        vm.renderOxideMain('oxideMain', vm.data.length, vm.chartIndex)
      })
    },
    renderTitle(angle, x, y, text, desc) {
      if (0 <= angle && angle < 90) {
        // this.addCircle(x - 10, y + 10)
        this.addPolyLine([
          [x - 10, y + 10],
          [x + 30, y - 15],
          [x + 120, y - 15]
        ])
        this.addText(x + 40, y - 20, text, 13, '#333')
        this.addText(x + 50, y + 4, desc, 18, '#4A4A4A')
      } else if (90 <= angle && angle < 180) {
        // this.addCircle(x - 10, y - 10)
        this.addPolyLine([
          [x - 10, y - 10],
          [x + 30, y + 15],
          [x + 120, y + 15]
        ])
        this.addText(x + 40, y + 10, text, 13, '#333')
        this.addText(x + 50, y + 34, desc, 18, '#4A4A4A')
      } else if (180 <= angle && angle < 270) {
        // this.addCircle(x + 10, y - 10)
        this.addPolyLine([
          [x + 10, y - 10],
          [x - 30, y + 15],
          [x - 120, y + 15]
        ])
        this.addText(x - 120, y + 10, text, 13, '#333')
        this.addText(x - 120, y + 34, desc, 18, '#4A4A4A')
      } else if (270 <= angle && angle <= 360) {
        // this.addCircle(x + 10, y + 10)
        this.addPolyLine([
          [x + 10, y + 10],
          [x - 30, y - 15],
          [x - 120, y - 15]
        ])
        this.addText(x - 120, y - 20, text, 13, '#333')
        this.addText(x - 120, y + 4, desc, 18, '#4A4A4A')
      }
    },
    addPolyLine(points) {
      this.chart.addShape('polyline', {
        attrs: {
          points: points,
          stroke: '#999',
        }
      })
    },
    addCircle(x, y) {
      this.chart.addShape('circle', {
        attrs: {
          x: x,
          y: y,
          r: 5,
          fill: '#fff',
        },
      })
    },
  }
}
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
.chart-box {
  height: 300px;
}
</style>
