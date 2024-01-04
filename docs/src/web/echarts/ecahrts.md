# Echarts 入门到精通

- 在main.js里面全局挂载
- 导入引用

## echarts 模板文件

Echarts开发流程:
1. 创建视图div, 必须指定宽高. 不然没法自适应.
2. 初始化Echarts: 初始化, 设置基础的options. 
3. 更新数据 setOptions: 更新数据源. 需要变化的数据. 
4. 动态resize. 根据window的变化更新视窗的大小. 

tips:
- options每次设置是包含之前的. 求并集.
- 监听事件需要移除.

```html
<template>
    <div ref="echart"></div>
</template>
<script>

export default {
    name: 'AllMoneyComponent',
    props: {
        money: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            title: String,
            echarts: null
        }
    },
    computed: {

    },
    methods: {

        initEchart() {
            this.echarts = this.$echarts.init(this.$refs.echart)
        },

        getData() {

        },

        updateOptions() {

        },

        resizeEcharts() {

        }
    }
}
</script>

<style lang="less">
.echart {
    width: 400px;
    height: 400px;
}
</style>
  
```

## Echarts options 配置信息：

1. title：图表的标题。
2. tooltip：提示框的配置。
3. legend：图例的配置。
4. xAxis：x轴的配置。
5. yAxis：y轴的配置。
6. series：数据系列的配置。


## Echarts-GL 3D配置.