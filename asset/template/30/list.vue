<template>
  <div class="zl-page">
    <!-- 标题 -->
    <div class="zl-header">
      <h3 class="title">仓库</h3>
      <div class="mani">
        <el-input v-model="search.content" size="mini" suffix-icon="el-icon-search" placeholder="请输入搜索内容" />
        <el-button class="ml10" type="primary" @click="queryList"><i class="el-icon-search" /> 搜索</el-button>
        <el-button class="ml10" type="primary" @click="operate('add', {})"><i class="el-icon-plus" /> 新增</el-button>
      </div>
    </div>
    <!-- 过滤 -->
    <el-form ref="search" size="mini" class="zl-search" inline :model="search">
      <el-form-item label="仓库名称">
        <el-input v-model="search.name" />
      </el-form-item>
      <el-form-item label="仓库类型">
        <el-select v-model="search.type" placeholder="请选择仓库类型">
          <el-option label="仓库类型1" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="">
        <el-button type="primary" icon="el-icon-search" @click="queryList">搜索</el-button>
      </el-form-item>
    </el-form>
    <!-- 表格 -->
    <div class="zl-table">
      <el-table
        v-loading="loading"
        element-loading-text="Loading"
        style="width: 100%"
        :data="list"
      >
        <el-table-column type="index" label="仓库编号" width="120" />
        <el-table-column property="name" label="仓库名称" width="150" />
        <el-table-column property="type" label="仓库类型" />
        <el-table-column property="status" label="状态">
          <template slot-scope="scope">
            {{ scope.row.status === '0' ? '失效' : '有效' }}
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="160px"
        >
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="operate('detail', scope.row)">查看</el-button>
            <el-button type="text" size="small" @click="operate('update', scope.row)">编辑</el-button>
            <el-dropdown trigger="click" class="zlst-margin-left-10px" @command="(command) =>operate(command, scope.row)">
              <el-button type="text" size="small">更多<i class="el-icon-arrow-down el-icon--right" /></el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="del">删除</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="zl-pagination">
      <el-pagination
        :current-page="pageNum"
        :page-sizes="[10, 20, 50]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="changeSize"
        @current-change="changePage"
      />
    </div>
  </div>
</template>
<script type="text/javascript">
import { mapActions } from 'vuex'

export default {
  name: '##List',
  data() {
    return {
      list: [],
      pageNum: 1,
      pageSize: 20,
      total: 0,
      loading: false,
      search: {
        content: '',
        type: ''
      }
    }
  },
  created() {
    this.queryList()
  },
  methods: {
    ...mapActions('$$', ['listAsync', 'delAsync']),
    // 数据操作
    operate(type, row) {
      switch (type) {
        case 'add':
        case 'detail':
        case 'update':
          this.$router.push({
            path: 'edit',
            query: {
              type,
              id: row.id || ''
            }
          })
          break
        case 'del':
          this.del(row)
          break

        default:
          break
      }
    },
    // 删除
    del(row) {
      this.$confirm('确定删除', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.delAsync({
          id: row.id
        }).then((res) => {
          this.$message({
            type: 'success',
            message: '删除成功!'
          })
          this.queryList()
        }).catch((err) => {
          console.error(err)
        })
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    // 修改页码
    changePage(val) {
      this.pageNum = val
      this.queryList()
    },
    // 修改每页长度
    changeSize(val) {
      this.pageNum = 1
      this.pageSize = val
      this.queryList()
    },
    // 获取列表
    async queryList() {
      this.loading = true
      this.list = await this.listAsync(this.search)
      this.loading = false
    }
  }
}
</script>
