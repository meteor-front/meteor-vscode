<template>
  <div class="panel-count">
    <div class="panel-count-title">
      <h4>{{title}}</h4><span>{{subTitle}}</span>
      <div class="more" v-if="more">
        <img src="@/assets/images/more.png" alt="">
      </div>
    </div>
    <div class="panel-count-body">
      <div class="item" :class="'item-' + (item.type || 'normal')" v-for="(item, index) in list" :key="index">
        <div class="mark" v-if="item.mark">{{ item.mark }}</div>
        <div class="number">{{ item.number }}</div>
      </div>
    </div>
  </div>
</template>
<script type="text/javascript">
export default {
  data() {
    return {
    }
  },
  props: {
    title: {
      type: String,
      default: '12'
    },
    subTitle: {
      type: String,
      default: '43'
    },
    more: {
      type: Boolean,
      default: false
    },
    list: {
      type: Array,
      default: function() {
        return [{
          type: 'warning',
          mark: '预约进厂',
          number: 1234
        }]
      }
    }
  },
  created() {
  },
  methods: {
  }
}
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
.panel-count {
  background: #fff;
  box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.1);
}
.panel-count-title {
  padding: 8px 16px;
  border-bottom: 1px solid #eee;
  h4 {
    display: inline-block;
    vertical-align: text-bottom;
    font-size: 16px;
    font-weight: normal;
  }
  span {
    vertical-align: text-bottom;
    font-size: 13px;
    color: #666;
  }
  .more {
    float: right;
    cursor: pointer;
  }
}
.panel-count-body {
  display: flex;
  .item {
    flex: 1;
    padding: 20px 0 20px 14px;
    &.item-normal {
      color: #1BBA66;
      .mark {
        background-color: #1BBA66;
      }
    }
    &.item-warning {
      color: #D97D44;
      .mark {
        background-color: #D97D44;
      }
    }
    &.item-danger {
      color: #D95244;
      .mark {
        background-color: #D95244;
      }
    }
    .mark {
      display: inline-block;
      vertical-align: middle;
      height: 22px;
      border-radius: 12px;
      color: #fff;
      font-size: 13px;
      line-height: 22px;
      padding: 0 12px;
    }
    .number {
      display: inline-block;
      vertical-align: middle;
      font-size: 36px;
    }
  }
}
</style>
