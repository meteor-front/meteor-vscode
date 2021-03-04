<template>
  <div class="zl-page">
    <!-- 标题 -->
    <div class="zl-header">
      <h3 class="title">
        <i class="el-icon-back" @click="back" />
        新增，编辑，详情
      </h3>
      <div v-if="rwDispatcherState === 'write'" class="mani">
        <el-button size="mini" @click="cancel">取消</el-button>
        <el-button size="mini" class="ml10" type="primary" @click="save">保存</el-button>
      </div>
    </div>
    <div class="zl-container">
      <div class="zl-main">
        <el-form ref="form" :model="form" :rules="rules" label-width="80px" inline>
          <h4 class="zl-title">仓库详情</h4>
          <div class="zl-form--body">
            <el-form-item label="仓库名称" required>
              <el-input-dispatcher v-model="form.name" placeholder="请输入仓库名称" />
            </el-form-item>
            <el-form-item label="仓库类型">
              <el-select v-model="form.type" placeholder="请选择仓库类型">
                <el-option
                  v-for="item in types"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
        </el-form>
      </div>
      <div class="zl-aside">
        <div class="zl-title">基本信息</div>
        <div class="zl-aside-main">
          <el-form label-width="80px" label-position="left">
            <el-form-item label="创建人">admin</el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
export default {
  name: '##Detail',
  provide() {
    return {
      rwDispatcherProvider: this
    }
  },
  data() {
    return {
      query: {},
      title: '',
      type: 'add',
      form: {
        name: '',
        type: ''
      },
      rules: {
        name: [{ required: true, message: '请输入仓库名称', trigger: 'change' }]
      },
      rwDispatcherState: 'write',
      maniStatus: {
        add: 'write',
        detail: 'read',
        update: 'write'
      },
      sel: '',
      types: [{
        label: '类型1',
        value: '1'
      }]
    }
  },
  created() {
    this.query = this.$route.query
    this.title = '新增，编辑，详情页，dispatcher'
    this.type = this.query.type
    this.changeRwStatus(this.maniStatus[this.type])
    switch (this.type) {
      case 'detail':
      case 'update':
        this.initForm()
        break
      default:
        break
    }
  },
  methods: {
    ...mapActions('$$', ['saveAsync', 'detailAsync']),
    // 初始化表单
    async initForm() {
      const res = await this.detailAsync({
        id: this.$route.query.id
      })
      this.form = res
    },
    // 返回
    back() {
      this.$confirm('取消后将不保存', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$router.go(-1)
      }).catch(action => {
      })
    },
    // 取消
    cancel() {
      if (this.rwDispatcherState === 'write') {
        this.$confirm('取消后将不保存', '确认不保存', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.changeRwStatus('read')
        }).catch(action => {
        })
      } else {
        this.changeRwStatus('read')
      }
    },
    // 改变rw状态
    changeRwStatus(status) {
      this.rwDispatcherState = status
    },
    // 保存
    save() {
      this.$refs.form.validate((valid) => {
        if (!valid) {
          return false
        }
        this.doSave()
        this.$message.success('保存成功')
      })
    },
    async doSave() {
      await this.saveAsync(this.form)
    }
  }
}
</script>
