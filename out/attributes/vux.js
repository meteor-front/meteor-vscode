"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    "v-transfer-dom": { "global": true, "framework": "vux" },
    "x-icon/type": { "options": ["ios-ionic-outline", "ios-arrow-back", "ios-arrow-forward", "ios-arrow-up", "ios-arrow-right", "ios-arrow-down", "ios-arrow-left", "ios-arrow-thin-up", "ios-arrow-thin-right", "ios-arrow-thin-down",
            "ios-arrow-thin-left", "ios-circle-filled", "ios-circle-outline", "ios-checkmark-empty", "ios-checkmark-outline", "ios-checkmark", "ios-plus-empty", "ios-plus-outline", "ios-plus", "ios-close-empty", "ios-close-outline", "ios-close",
            "ios-minus-empty", "ios-minus-outline", "ios-minus", "ios-information-empty", "ios-information-outline", "ios-information-outline", "ios-information", "ios-help-empty", "ios-help-outline", "ios-help", "ios-search", "ios-search-strong",
            "ios-star", "ios-star-half", "ios-star-outline", "ios-heart", "ios-heart-outline"], "description": "icon type" },
    "x-icon/size": { "description": "icon number size" },
    "x-button/type": { "options": ["default", "primary", "warn"], "description": "button type, primary color different" },
    "x-button/disabled": { type: "boolean", "description": "是否不可点击, 默认false" },
    "x-button/text": { "description": "按钮文字，同默认slot" },
    "x-button/mini": { type: "boolean", "description": "是否为mini类型，即小尺寸的按钮, 默认false" },
    "x-button/plain": { type: "boolean", "description": "是否是plain样式，没有背景色, 默认false" },
    "x-button/action-type": { "options": ["submit", "button", "reset"], "description": "button的type属性，默认为浏览器默认(submit)" },
    "x-button/link": { "description": "vue-router 路由, 值为 BACK 等同于 go(-1)" },
    "x-button/show-loading": { type: "boolean", "description": "显示加载图标, 默认false" },
    "flexbox/gutter": { "description": "间隙像素大小（px），值为number类型" },
    "flexbox/orient": { "options": ["horizontal", "vertical"], "description": "排布方向" },
    "flexbox/justify": { "options": ["center", "flex-start", "flex-end", "baseline", "end", "stretch"], "description": "flex的justify-content属性" },
    "flexbox/align": { "options": ["center", "flex-start", "flex-end", "baseline", "end", "stretch"], "description": "flex的align-items属性" },
    "flexbox/wrap": { "options": ["nowrap", "wrap", "inherit"], "description": "flex的wrap属性" },
    "flexbox/direction": { "options": ["column", "column-reverse", "row", "row-reverse", "inherit", "initial", "revert"], "description": "flex的flex-direction属性" },
    "flexbox-item/span": { "description": "占用宽度，如果不设置，所有flexbox-item将平分。number类型" },
    "flexbox-item/order": { "options": ["initial", "inherit", "revert", "unset"], "description": "flex的order属性" },
    "grid/rows": { "description": "(v2.6.0 之后废弃，使用 col 替代)宫格行数，建议少于5，默认值3" },
    "grid/cols": { "description": "列数。如果为非单行 Grid，需要设置 cols，否则所有 GridItem 会平均宽度显示在一行。默认值3" },
    "grid/show-lr-borders": { type: "boolean", "description": "是否显示左右边框， 默认值true" },
    "grid/show-vertical-dividers": { type: "boolean", "description": "是否显示垂直分割线，默认值true" },
    "grid-item/icon": { "description": "图标地址，如果是线上地址，推荐使用该prop。如果是本地图标资源，使用slot=icon可以保证资源被正确打包" },
    "grid-item/label": { "description": "label 文字" },
    "grid-item/link": { "description": "vue-router 路径" },
    "calendar/title": { "description": "label文字" },
    "calendar/placeholder": { "description": "占位提示文字" },
    "calendar/show-popup-header": { type: "boolean", "description": "是否显示弹窗头部，当为多选时强制显示，单选时默认不显示	" },
    "calendar/popup-header-title": { "description": "弹窗头部文字" },
    "calendar/display-format": { "description": "格式化显示值, 类型为函数" },
    "calendar/readonly": { "options": ["readonly"], "description": "是否禁用弹窗选择" },
    "calendar/on-change": { type: "method", "description": "值改变时触发" },
    "calendar/on-show": { type: "method", "description": "弹窗显示时触发" },
    "calendar/on-hide": { type: "method", "description": "弹窗关闭时触发" },
    "cell-box/is-link": { type: "boolean", "description": "是否为链接，如果是，右侧将会出现指引点击的右箭头" },
    "cell-box/link": { "description": "点击链接，可以为http(s)协议，也可以是 vue-router 支持的地址形式" },
    "cell-box/border-intent": { type: "boolean", "description": "是否显示边框与左边的间隙" },
    "cell-box/align-items": { "options": ["center", "flex-start", "flex-end", "baseline", "end", "stretch"], "description": "flex 布局 align-items 设置" },
    "cell/title": { "description": "	左边标题文字" },
    "cell/inline-desc": { "description": "标题下面文字，一般为说明文字" },
    "cell/link": { "description": "点击链接，可以为http(s)协议，也可以是 vue-router 支持的地址形式" },
    "cell/is-link": { "description": "是否为链接，如果是，右侧将会出现指引点击的右箭头" },
    "cell/primary": { "options": ["title", "content"], "description": "对应的div会加上weui_cell_primary类名实现内容宽度自适应，默认title" },
    "cell/is-loading": { type: "boolean", "description": "是否显示加载图标，适用于异步加载数据的场景" },
    "cell/value-align": { "options": ["left", "right"], "description": "文字值对齐方式，当设为 right 时，primary 值将会设为 content" },
    "cell/border-intent": { type: "boolean", "description": "是否显示边框与左边的间隙" },
    "cell/arrow-direction": { "options": ["up", "down"], "description": "右侧箭头方向" },
    "cell/disabled": { type: "boolean", "description": "对 label 和箭头(如果使用 is-link )显示不可操作样式" },
    "cell/align-items": { "options": ["center", "flex-start", "flex-end", "baseline", "end", "stretch"], "description": "align-items 样式值" },
    "checker/default-item-class": { "description": "默认状态class" },
    "checker/selected-item-class": { "description": "选中样式class" },
    "checker/disabled-item-class": { "description": "不可选样式class" },
    "checker/type": { "options": ["radio", "checkbox"], "description": "类型，单选为radio, 多选为checkbox" },
    "checker/max": { "description": "最多可选个数，多选时可用，number类型" },
    "checker/radio-required": { type: "boolean", "description": "在单选模式下是否必选一个值。设为 true 后点击当前选中项不会取消选中。" },
    "checker/on-change": { "description": "value值变化时触发" },
    "checklist/title": { "description": "标题" },
    "checklist/required": { type: "boolean", "description": "是否为必选" },
    "checklist/options": { "description": "选项列表，可以为[{key:'name',value:'value',inlineDesc:'inlineDesc'}]的形式" },
    "checklist/max": { "description": "最多可选个数，类型number" },
    "checklist/min": { "description": "最少可选个数，类型number" },
    "checklist/random-order": { type: "boolean", "description": "是否随机打乱选项顺序" },
    "checklist/check-disabled": { type: "boolean", "description": "是否进行可选检测，默认情况下当选择个数等于可选个数(max)时，其他项不可选择。该选项主要适用于从多个选项列表中收集值的场景。注意的该选项设为 false 时 max 设置将失效。" },
    "checklist/label-position": { "options": ["left", "right"], "description": "label 位置，可以设置为 left 或者 right" },
    "checklist/disabled": { "options": ["disalbed"], "description": "是否禁用操作" },
    "checklist/on-change": { "description": "值变化时触发，参数为 (value, label)，其中 label 参数在 v2.5.7 后支持" },
    "datetime-range/title": { "description": "标题文字" },
    "datetime-range/inline-desc": { "description": "描述字符" },
    "datetime-range/placeholder": { "description": "提示文字，当value为空时显示" },
    "datetime-range/start-date": { "description": "限定最小日期，注意该限制只能限定到日期，不能限定到小时分钟" },
    "datetime-range/end-date": { "description": "限定最大日期，注意该限制只能限定到日期，不能限定到小时分钟" },
    "datetime-range/format": { "description": "日期栏的显示格式，默认：YYYY-MM-DD" },
    "datetime-range/on-change": { "description": "表单值变化时触发, 参数 (newVal)" },
    "datetime/format": { "description": "时间格式，不支持特殊字符，只能类似 YYYY-MM-DD HH:mm 这样的格式（不支持秒 ss）, 另外支持 YYYY-MM-DD A 这样的格式(A为上下午)" },
    "datetime/title": { "description": "标题" },
    "datetime/inline-desc": { "description": "描述字符" },
    "datetime/placeholder": { "description": "提示文字，当value为空时显示" },
    "datetime/min-year": { "description": "可选择的最小年份，类型number" },
    "datetime/max-year": { "description": "可选择的最大年份，类型number" },
    "datetime/min-hour": { "description": "限定小时最小值，类型number，默认值0" },
    "datetime/max-hour": { "description": "限定小时最大值，类型number，默认值23" },
    "datetime/confirm-text": { "description": "确认按钮文字" },
    "datetime/cancel-text": { "description": "取消按钮文字" },
    "datetime/clear-text": { "description": "显示在中间的自定义按钮的文字" },
    "datetime/year-row": { "description": "年份的渲染模板" },
    "datetime/month-row": { "description": "月份的渲染模板" },
    "datetime/day-row": { "description": "日期的渲染模板" },
    "datetime/hour-row": { "description": "小时的渲染模板" },
    "datetime/minute-row": { "description": "分钟的渲染模板" },
    "datetime/start-date": { "description": "限定最小日期，格式必须为 YYYY-MM-DD，注意该限制只能限定到日期，不能限定到小时分钟。小时限定请使用min-hour和max-hour" },
    "datetime/end-date": { "description": "限定最大日期，格式必须为 YYYY-MM-DD，注意该限制只能限定到日期，不能限定到小时分钟" },
    "datetime/required": { type: "boolean", "description": "是否必填" },
    "datetime/display-format": { "description": "自定义显示值" },
    "datetime/readonly": { "options": ["readonly"], "description": "自定义显示值" },
    "datetime/show": { type: "boolean", "description": "控制显示" },
    "datetime/minute-list": { "description": "定义分钟列表，比如 ['00', '15', '30', '45']" },
    "datetime/hour-list": { "description": "定义小时列表，比如 ['09', '10', '11', '12']" },
    "datetime/default-selected-value": { "description": "设置默认选中日期，当前 value 为空时有效" },
    "datetime/compute-hours-function": { "description": "动态设置小时列表，参数为 (value, isToday, generateRange)" },
    "datetime/compute-days-function": { "description": "动态设置日期列表，参数为 ({year, month, min, max}, generateRange)" },
    "datetime/order-map": { "description": "自定义列顺序, 如 {year: 1, month: 2, day: 3, hour: 4, minute: 5, noon: 6}" },
    "datetime/on-change": { type: "method", "description": "表单值变化时触发, 参数 (newVal)" },
    "datetime/on-clear": { type: "method", "description": "点击显示在中间的自定义按钮时触发" },
    "datetime/on-show": { type: "method", "description": "弹窗显示时触发" },
    "datetime/on-hide": { type: "method", "description": "弹窗关闭时触发" },
    "datetime/on-cancel": { type: "method", "description": "点击取消按钮或者遮罩时触发，等同于事件 on-hide(cancel)" },
    "datetime/on-confirm": { type: "method", "description": "点击确定按钮时触发，等同于事件 on-hide(confirm)" },
    "group/title": { "description": "分组标题" },
    "group/title-color": { "description": "分组标题文字颜色" },
    "group/label-width": { "description": "为子元素设定统一label宽度" },
    "group/label-align": { "description": "为子元素设定统一对齐方式" },
    "group/label-margin-right": { "description": "为子元素设定统一的右边margin" },
    "group/gutter": { "description": "设定group的上边距，只能用于没有标题时" },
    "inline-x-switch/disabled": { type: "boolean", "description": "是否不可点击" },
    "inline-x-switch/value-map": { "description": "用于自定义 false 和 true 映射的实际值，用于方便处理比如接口返回了 0 1 这类非 boolean 值的情况。默认值： [false, true]" },
    "inline-x-number/width": { "description": "数字所占据的宽度，类型string，默认50px" },
    "inline-x-number/button-style": { "options": ["round"], "description": "按钮样式，可选['round']" },
    "inline-x-number/min": { "description": "最小值，类型number" },
    "inline-x-number/max": { "description": "最打值，类型number" },
    "popup-picker/title": { "description": "标题" },
    "popup-picker/cancel-text": { "description": "弹窗的取消文字" },
    "popup-picker/confirm-text": { "description": "弹窗的确认文字" },
    "popup-picker/placeholder": { "description": "提示文字" },
    "popup-picker/show-name": { type: "boolean", "description": "是否显示文字值而不是key" },
    "popup-picker/inline-desc": { "description": "Cell的描述文字" },
    "popup-picker/show": { type: "boolean", "description": "显示 (支持.sync修饰 next)" },
    "popup-picker/value-text-align": { "options": ["left", "center", "right"], "description": "value 对齐方式(text-align)" },
    "popup-picker/display-format": { type: "method", "description": "自定义在cell上的显示格式，参数为当前 value，使用该属性时，show-name 属性将失效" },
    "popup-picker/popup-style": { "description": "弹窗标题" },
    "popup-picker/disabled": { type: "boolean", "description": "是否禁用选择" },
    "popup-picker/on-change": { type: "method", "description": "值变化时触发" },
    "popup-picker/on-show": { type: "method", "description": "弹窗出现时触发" },
    "popup-picker/on-hide": { type: "method", "description": "弹窗关闭时触发" },
    "popup-picker/on-shadow-change": { type: "method", "description": "picker 值变化时触发，即滑动 picker 时触发" },
    "popup-radio/readonly": { "options": ["readonly"], "description": "只读样式，类似于 cell" },
    "popup-radio/options": { "description": "可选选项， [{ key: 'A', value: 'label A' }, { key: 'B', value: 'label B' }]" },
    "popup-radio/on-show": { type: "method", "description": "弹窗显示时触发" },
    "popup-radio/on-hide": { type: "method", "description": "	弹窗关闭时触发" },
    "picker/data": { "description": "选项列表数据，可如：[[{ name: '2019届5班', value: '1' }, { name: '2019届4班', value: '2' }]]" },
    "picker/columns": { "description": "指定联动模式下的列数，当不指定时表示非联动， 类型number" },
    "picker/fixed-columns": { "description": "指定显示多少列，隐藏多余的， 类型number" },
    "picker/column-width": { "description": "定义每一列宽度，只需要定义除最后一列宽度，最后一列自动宽度， 比如对于3列选择，可以这样：[1/2, 1/5]" },
    "picker/on-change": { type: "method", "description": "选择值变化时触发" },
    "rater/max": { "description": "最多可选个数，类型number，默认5" },
    "rater/disabled": { type: "boolean", "description": "是否禁用" },
    "rater/star": { "description": "字符，默认★" },
    "rater/active-color": { "description": "选中时的颜色，默认#fc6" },
    "rater/margin": { "description": "间隙值，类型number，默认2" },
    "rater/font-size": { "description": "字体大小，类型number，默认25" },
    "rater/min": { "description": "最小值，类型number，默认0" },
    "radio/value": { "description": "表单值，使用v-model绑定" },
    "radio/options": { "description": "可选列表，[{key: 'key1', value: 1}, {key: 'key2', value: 2}]" },
    "radio/fill-mode": { type: "boolean", "description": "是否可填写" },
    "radio/fill-placeholder": { "description": "可填写时的提示文字" },
    "radio/fill-label": { "description": "可填写时的label文字" },
    "radio/disabled": { type: "boolean", "description": "禁用操作" },
    "radio/selected-label-style": { "description": "设置选中时的 label 样式，比如使用其他颜色更容易区分是否为选中项" },
    "range/decimal": { type: "boolean", "description": "是否在变化时显示小数" },
    "range/min": { "description": "可选最小值，类型number，默认0" },
    "range/max": { "description": "可选最大值，类型number，默认100" },
    "range/step": { "description": "步长，类型number，默认1" },
    "range/disabled": { type: "boolean", "description": "是否禁用" },
    "range/minHTML": { "description": "最小值显示的html模板" },
    "range/maxHTML": { "description": "最大值显示的html模板" },
    "range/disabled-opacity": { "description": "禁用样式的透明度，类型number" },
    "range/rangeBarHeight": { "description": "高度，类型number，默认1" },
    "range/on-change": { type: "method", "description": "绑定值变化时触发事件" },
    "range/on-touchstart": { type: "method", "description": "手指放到元素上时触发" },
    "range/on-touchend": { type: "method", "description": "手指离开元素时触发" },
    "selector/title": { "description": "标题" },
    "selector/direction": { "options": ["ltr", "rtl"], "description": "选项对齐方式，同原生 select 属性一致，可选值为 ltr(left-to-right，默认), rtl" },
    "selector/options": { "description": "选项列表，可以为简单数组，或者 { key: KEY, value: VALUE } 结构的键值对数组。当使用键值对时，返回的value为key的值。" },
    "selector/name": { "description": "表单的name名字" },
    "selector/placeholder": { "description": "提示文字" },
    "selector/readonly": { type: "boolean", "description": "是否不可选择" },
    "selector/value-map": { "description": "设置键值对映射用以自动转换接口数据, 如 ['value', 'label']" },
    "selector/on-change": { type: "method", "description": "值变化时触发" },
    "swipeout-item/sensitivity": { "description": "滑动多少距离后开始触发菜单显示，类型number，默认值0" },
    "swipeout-item/auto-close-on-button-click": { type: "boolean", "description": "点击按钮后是否收回菜单" },
    "swipeout-item/disabled": { type: "boolean", "description": "是否不可滑动" },
    "swipeout-item/threshold": { "description": "滑动多少距离后自动打开菜单，否则收回。可以为小于1的比例或者宽度值，类型number，默认0.3" },
    "swipeout-item/transition-mode": { "options": ["reveal", "follow"], "description": "菜单打开方式，reveal表示菜单不动内容滑出，follow表示菜单随内容滑出" },
    "swipeout-item/on-open": { type: "method", "description": "菜单完全打开时触发" },
    "swipeout-item/on-close": { type: "method", "description": "菜单完全关闭时触发" },
    "swipeout-button/text": { "description": "按钮文字，同slot=default" },
    "swipeout-button/background-color": { "description": "背景颜色" },
    "swipeout-button/type": { "description": "内置的颜色类型，可选primary, warn" },
    "swipeout-button/width": { "description": "按钮宽度" },
    "search/placeholder": { "description": "提示文字，默认search" },
    "search/cancel-text": { "description": "取消文字" },
    "search/results": { "description": "指定搜索结果, 为带有 title key 的对象组成的数组，如 [{title: 'hello', otherData: otherValue}], auto-fixed 为 false 时不会显示结果" },
    "search/auto-fixed": { type: "boolean", "description": "是否自动固定在顶端" },
    "search/top": { "description": "自动固定时距离顶部的距离，默认0px" },
    "search/position": { "description": "自动固定时的定位，一些布局下可能需要使用其他定位，比如absolute" },
    "search/auto-scroll-to-top": { type: "boolean", "description": "Safari下弹出键盘时可能会出现看不到input，需要手动滚动，启用该属性会在fix时滚动到顶端" },
    "search/on-submit": { type: "method", "description": "表单提交时触发" },
    "search/on-cancel": { type: "method", "description": "点击取消按钮时触发" },
    "search/on-change": { type: "method", "description": "输入文字变化时触发" },
    "search/on-result-click": { type: "method", "description": "击结果条目时触发，原来的result-click事件不符合规范已经废弃" },
    "search/on-focus": { type: "method", "description": "输入框获取到焦点时触发" },
    "search/on-blur": { type: "method", "description": "输入框失去焦点时触发" },
    "search/on-clear": { type: "method", "description": "点击清除按钮时触发" },
    "x-switch/title": { "description": "label文字" },
    "x-switch/disabled": { type: "boolean", "description": "是否不可点击" },
    "x-switch/inline-desc": { "description": "标签下文字" },
    "x-switch/prevent-default": { type: "boolean", "description": "阻止点击时自动设定值" },
    "x-switch/value-map": { "description": "用于自定义 false 和 true 映射的实际值，用于方便处理比如接口返回了 0 1 这类非 boolean 值的情况，默认值：[false, true]" },
    "x-switch/on-change": { type: "method", "description": "值变化时触发，参数为 (currentValue)" },
    "x-switch/on-click": { type: "method", "description": "点击组件时触发" },
    "x-input/type": { "options": ["text", "number", "password", "email", "tel"], "description": "即input的type属性，目前支持 text,number,email,password,tel" },
    "x-input/is-type": { "description": "内置验证器，支持email,china-name,china-mobile, 同样也支持直接传函数, 需要同步返回一个对象{valid:true}或者{valid:false, msg:错误信息}" },
    "x-input/required": { type: "boolean", "description": "是否必值，如果不禁用验证，当没有填写时会在右侧显示错误icon" },
    "x-input/title": { "description": "label文字" },
    "x-input/placeholder": { "description": "placeholder 提示" },
    "x-input/show-clear": { type: "boolean", "description": "是否显示清除icon" },
    "x-input/min": { "description": "最小输入字符限制，类型number" },
    "x-input/max": { "description": "最大输入字符限制，等同于maxlength，达到限制到不能再输入，类型number" },
    "x-input/disabled": { type: "boolean", "description": "是否禁用填写" },
    "x-input/readonly": { type: "boolean", "description": "同input的标准属性readonly" },
    "x-input/debounce": { "description": "debounce用以限制on-change事件触发。如果你需要根据用户输入做ajax请求，建议开启以节省无效请求和服务器资源，单位为毫秒，类型number" },
    "x-input/placeholder-align": { "options": ["left", "center", "right"], "description": "placeholder 文字对齐方式，默认left" },
    "x-input/text-align": { "options": ["left", "center", "right"], "description": "值对齐方式，默认left" },
    "x-input/label-width": { "description": "label 宽度，权重比 group 的 labelWidth 高。不设定时将进行自动宽度计算，但超过15个字符时不会进行宽度设定。" },
    "x-input/mask": { "description": "(beta) 值格式化，依赖于 vanilla-masker，其中 9 表示数字，A 表示大写字母，S 表示数字或者字母" },
    "x-input/should-toast-error": { type: "boolean", "description": "是否在点击错误图标时用 toast 的形式显示错误" },
    "x-input/on-blur": { type: "method", "description": "input的blur事件" },
    "x-input/on-focus": { type: "method", "description": "input的focus事件" },
    "x-input/on-enter": { type: "method", "description": "input输入完成后点击enter(确认)事件" },
    "x-input/on-change": { type: "method", "description": "输入值变化时触发。如果你使用了debounce，那么触发将不会是实时的。" },
    "x-input/on-click-error-icon": { type: "method", "description": "点击错误图标时触发，你可以关闭 should-toast-error 然后用这个事件来自定义显示错误的提示内容" },
    "x-input/on-click-clear-icon": { type: "method", "description": "点击清除按钮时触发" },
    "x-number/title": { "description": "标题" },
    "x-number/min": { "description": "最小值，类型number" },
    "x-number/max": { "description": "最大值，类型number" },
    "x-number/step": { "description": "步长，类型number，默认值：1" },
    "x-number/fillable": { type: "boolean", "description": "是否可填写" },
    "x-number/width": { "description": "输入框宽度，类型string，默认值：50px" },
    "x-number/button-style": { "options": ["square", "round"], "description": "按钮样式，可选值为square或者round" },
    "x-number/align": { "options": ["left", "right"], "description": "按钮部分位置，默认在右边(right)，可选值为left和right" },
    "x-textarea/title": { "description": "label文字" },
    "x-textarea/inline-desc": { "description": "位于标题下的描述文字" },
    "x-textarea/show-counter": { type: "boolean", "description": "是否显示计数，默认true" },
    "x-textarea/max": { "description": "最大长度限制，类型number，默认0" },
    "x-textarea/name": { "description": "表单名字" },
    "x-textarea/placeholder": { "description": "没有值时的提示文字" },
    "x-textarea/rows": { "description": "textarea 标准属性 rows，类型number，默认3" },
    "x-textarea/cols": { "description": "textarea 标签属性 cols，类型number，默认30" },
    "x-textarea/height": { "description": "高度，类型number，默认0" },
    "x-textarea/readonly": { type: "boolean", "description": "textarea 标签属性 readonly" },
    "x-textarea/disabled": { type: "boolean", "description": "textarea 标签属性 disabled" },
    "x-textarea/autosize": { type: "boolean", "description": "是否根据内容自动设置高度" },
    "x-textarea/on-change": { type: "method", "description": "表单值变化时触发" },
    "x-textarea/on-focus": { type: "method", "description": "focus 事件" },
    "x-textarea/on-blur": { type: "method", "description": "blur 事件" },
    "badge/text": { "description": "	显示的文字" },
    "countup/start-val": { "description": "开始数字，类型number，默认值：0" },
    "countup/end-val": { "description": "结束数字，类型number" },
    "countup/decimals": { "description": "	小数点位数，类型number，默认值：0" },
    "countup/duration": { "description": "	耗时（秒），类型number，默认值：2" },
    "countup/options": { "description": "countup.js的设置项" },
    "countup/start": { type: "boolean", "description": "是否自动开始计数" },
    "countup/tag": { "description": "渲染标签，默认值：span" },
    "marquee/interval": { "description": "切换时间间隙，类型number，默认值：2000" },
    "marquee/duration": { "description": "切换动画时间，类型number，默认值：300" },
    "marquee/direction": { "options": ["up", "down"], "description": "切换方向，可选['up', 'down']" },
    "marquee/item-height": { "description": "条目高度，当默认状态为隐藏时你需要设置值，否则组件渲染时会获取不到正确高度，类型number" },
    "previewer/list": { "description": "图片列表，如 [{ src: 'https://placekitten.com/800/400', w: 600, h: 400 }]" },
    "previewer/options": { "description": "photoswipe的设置" },
    "previewer/on-close": { type: "method", "description": "关闭时触发" },
    "previewer/on-index-change": { type: "method", "description": "切换图片后触发(首次打开不会触发)" },
    "swiper/list": { "description": "轮播图片列表，如果有自定义样式需求，请使用 swiper-item(使用 swiper-item 时仅有2个的情况下不支持循环)" },
    "swiper/direction": { "options": ["horizontal"], "description": "方向，默认值：horizontal" },
    "swiper/show-dots": { type: "boolean", "description": "是否显示提示点" },
    "swiper/show-desc-mask": { type: "boolean", "description": "是否显示描述半透明遮罩" },
    "swiper/dots-position": { "options": ["right", "left"], "description": "提示点位置，默认值：right" },
    "swiper/dots-class": { "description": "提示className" },
    "swiper/auto": { type: "boolean", "description": "" },
    "swiper/loop": { type: "boolean", "description": "是否循环" },
    "swiper/interval": { "description": "轮播停留时长，类型： number，默认值：3000" },
    "swiper/threshold": { "description": "当滑动超过这个距离时才滑动，类型number，默认值：50" },
    "swiper/duration": { "description": "切换动画时间，类型number，默认值：300" },
    "swiper/height": { "description": "高度值。如果为100%宽度并且知道宽高比，可以设置aspect-ratio自动计算高度，默认值：180px" },
    "swiper/aspect-ratio": { "description": "用以根据当前可用宽度计算高度值，类型：number" },
    "swiper/min-moving-distance": { "description": "超过这个距离时才滑动，类型：number，默认值：0" },
    "swiper/on-index-change": { type: "method", "description": "轮播 index 变化时触发" },
    "swiper/on-get-height": { type: "method", "description": "高度获取后触发" },
    "actionsheet/show-cancel": { type: "boolean", "description": "是否显示取消菜单，对安卓风格无效" },
    "actionsheet/cancel-text": { "description": "取消菜单的显示文字，默认值：cancel" },
    "actionsheet/theme": { "options": ["ios", "android"], "description": "菜单风格，可选值为['ios','android']" },
    "actionsheet/menus": { "description": "菜单项列表，举例：{menu1: '删除'}，如果名字上带有.noop表明这是纯文本(HTML)展示，不会触发事件，用于展示描述或者提醒。" },
    "actionsheet/close-on-clicking-mask": { type: "boolean", "description": "点击遮罩时是否关闭菜单，适用于一些进入页面时需要强制选择的场景。" },
    "actionsheet/close-on-clicking-menu": { type: "boolean", "description": "点击菜单时是否自动隐藏" },
    "actionsheet/on-click-menu": { type: "method", "description": "点击菜单时触发" },
    "actionsheet/on-click-menu-{menuKey}": { type: "method", "description": "点击事件的快捷方式, menuKey与label的值有关。举例：如果你有一个菜单名字为delete, 那么你可以监听 on-click-menu-delete" },
    "actionsheet/on-click-menu-cancel": { type: "method", "description": "点击取消菜单时触发" },
    "actionsheet/on-click-mask": { type: "method", "description": "点击遮罩时触发" },
    "actionsheet/on-after-show": { type: "method", "description": "显示动画结束时触发" },
    "actionsheet/on-after-hide": { type: "method", "description": "隐藏动画结束时触发" },
    "alert/content": { "description": "提示内容，作为 slot:default 的默认内容，如果使用 slot:default, 将会失效" },
    "alert/button-text": { "description": "按钮文字，默认值：ok" },
    "alert/hide-on-blur": { type: "boolean", "description": "是否在点击遮罩时自动关闭弹窗" },
    "alert/mask-transition": { "description": "遮罩动画，默认值： vux-fade" },
    "alert/dialog-transition": { "description": "弹窗主体动画，默认值：vux-dialog" },
    "alert/mask-z-index": { "description": "遮罩层 z-index 值，默认值：1000" },
    "alert/on-show": { type: "method", "description": "弹窗显示时触发" },
    "alert/on-hide": { type: "method", "description": "弹窗关闭时触发" },
    "confirm/show-input": { type: "boolean", "description": "是否显示输入框，如果为true，slot会失效" },
    "confirm/theme": { "options": ["ios", "android"], "description": "弹窗风格，可以是ios或android" },
    "confirm/hide-on-blur": { "description": "是否在点击遮罩时自动关闭弹窗" },
    "confirm/confirm-text": { "description": "确认按钮的显示文字，默认值：确定" },
    "confirm/cancel-text": { "description": "取消按钮的显示文字" },
    "confirm/mask-transition": { "description": "遮罩动画，默认值：vux-fade" },
    "confirm/dialog-transition": { "description": "弹窗动画，默认值：vux-dialog" },
    "confirm/close-on-confirm": { type: "boolean", "description": "是否在点击确认按钮时自动关闭" },
    "confirm/input-attrs": { "description": "input 属性" },
    "confirm/mask-z-index": { "description": "遮罩层 z-index 值，类型number，默认值：1000" },
    "confirm/show-cancel-button": { type: "boolean", "description": "是否显示取消按钮" },
    "confirm/show-confirm-button": { type: "boolean", "description": "是否显示确定按钮" },
    "confirm/on-cancel": { type: "method", "description": "点击取消按钮时触发" },
    "confirm/on-confirm": { type: "method", "description": "点击确定按钮时触发, 参数为prompt中输入的值" },
    "confirm/on-show": { type: "method", "description": "弹窗出现时触发" },
    "confirm/on-hide": { type: "method", "description": "弹窗隐藏时触发" },
    "loading/show": { type: "boolean", "description": "显示状态" },
    "loading/text": { "description": "提示文字，值为空字符时隐藏提示文字，默认值： 加载中" },
    "loading/position": { "description": "定位方式，默认为fixed，在100%的布局下用absolute可以避免抖动，默认值： fixed" },
    "loading/transition": { "description": "显示动画名字，默认值：vux-mask" },
    "popup/height": { "description": "高度，设置100%为整屏高度。当 position 为 top 或者 bottom 时有效。默认值：auto" },
    "popup/hide-on-blur": { type: "boolean", "description": "点击遮罩时是否自动关闭" },
    "popup/is-transparent": { type: "boolean", "description": "是否为透明背景" },
    "popup/width": { "description": "设置 100% 宽度必须使用该属性。在 position 为 left 或者 right 时有效。默认值：auto" },
    "popup/position": { "options": ["left", "right", "top", "bottom"], "description": "位置，可取值 ['left', 'right', 'top', 'bottom']" },
    "popup/show-mask": { type: "boolean", "description": "是否显示遮罩" },
    "popup/popup-style": { "description": "弹窗样式，可以用于强制指定 z-index" },
    "popup/hide-on-deactivated": { type: "boolean", "description": "是否在 deactived 事件触发时自动关闭，避免在路由切换时依然显示弹窗" },
    "popup/should-rerender-on-show": { type: "boolean", "description": "是否在显示时重新渲染内容区域(以及滚动到顶部)，适用于每次显示弹窗需要重新获取数据初始化的场景" },
    "popup/should-scroll-top-on-show": { type: "boolean", "description": "是否在显示时自动滚动到顶部，当你自定义滚动容器时需要手动为该容器加上类名 vux-scrollable" },
    "popup/on-hide": { type: "method", "description": "关闭时触发" },
    "popup/on-show": { type: "method", "description": "显示时触发" },
    "popup/on-first-show": { type: "method", "description": "第一次显示时触发，可以在该事件回调里初始化数据或者界面" },
    "popup-header/left-text": { "description": "左侧文字" },
    "popup-header/right-text": { "description": "右侧文字" },
    "popup-header/show-bottom-border": { "description": "是否显示底部边框" },
    "popup-header/on-click-left": { type: "method", "description": "左侧文字点击时触发" },
    "popup-header/on-click-right": { type: "method", "description": "右侧文字点击时触发" },
    "popover/content": { "description": "弹出窗口内容" },
    "popover/placement": { "options": ["top", "left", "right", "bottom"], "description": "弹出窗口位置" },
    "popover/gutter": { "description": "箭头和触发元素之间的距离，类型： number，默认值：5" },
    "popover/on-show": { type: "method", "description": "弹窗显示时触发" },
    "popover/on-hide": { type: "method", "description": "弹窗隐藏时触发" },
    "spinner/type": { "options": ["android", "ios", "ios-small", "bubbles", "circles", "crescent", "dots", "lines", "ripple", "spiral"], "description": "" },
    "spinner/size": { "description": "大小，类型number" },
    "toast/time": { "description": "显示时间，类型number，默认值：2000" },
    "toast/type": { "options": ["success", "warn", "cancel", "text"], "description": "类型，可选值 success, warn, cancel, text" },
    "toast/width": { "description": "宽度，类型string，默认值：7.6em" },
    "toast/is-show-mask": { type: "boolean", "description": "是否显示遮罩，如果显示，用户将不能点击页面上其他元素" },
    "toast/text": { "description": "提示内容，支持 html，和默认slot同样功能" },
    "toast/position": { "options": ["default", "top", "middle", "bottom"], "description": "显示位置，可选值 default, top, middle, bottom" },
    "toast/on-show": { type: "method", "description": "提示弹出时触发" },
    "toast/on-hide": { type: "method", "description": "提示隐藏时触发" },
    "button-tab/height": { "description": "高度值, 单位为像素，类型number，默认值：30" },
    "button-tab-item/selected": { type: "boolean", "description": "是否选中，默认：false" },
    "button-tab-item/on-item-click": { type: "method", "description": "" },
    "tab/line-width": { "description": "线条宽度，类型number，默认值：3" },
    "tab/active-color": { "description": "选中时文字颜色" },
    "tab/default-color": { "description": "默认文字颜色" },
    "tab/disabled-color": { "description": "不可点击时文字颜色" },
    "tab/bar-active-color": { "description": "设置底部bar颜色，该颜色也可以通过less变量@tab-bar-active-color设置。" },
    "tab/animate": { type: "boolean", "description": "切换时是否需要动画，默认值： true" },
    "tab/custom-bar-width": { "description": "设置底部bar宽度，默认宽度是整体tab宽度平分，比如50px。使用函数时参数为当前索引index，你可以定义不同tab-item对应的bar宽度。" },
    "tab/badge-label": { "description": "徽标文字" },
    "tab/badge-background": { "description": "徽标背景颜色" },
    "tab/badge-color": { "description": "徽标文字颜色" },
    "tab/prevent-default": { type: "boolean", "description": "是否禁止自动切换 tab-item" },
    "tab/scroll-threshold": { "description": "滚动阀值，超过可滚动，类型：number，默认值：4" },
    "tab/bar-position": { "options": ["top", "bottom"], "description": "边框位置，可以为 bottom 或者 top。仅支持 animate 为 true 的情况。" },
    "tab-item/disabled": { type: "boolean", "description": "是否不可选" },
    "tab-item/active-class": { "description": "当前项选中时的class" },
    "tab-item/on-item-click": { type: "method", "description": "	当前 tabItem 被点击时触发" },
    "tabbar/icon-class": { "description": "图标的class名" },
    "tabbar/on-index-change": { type: "method", "description": "value 值变化时触发" },
    "tabbar-item/selected": { type: "boolean", "description": "是否选中当前项，你也可以使用v-model来指定选中的tabbar-item的index" },
    "tabbar-item/badge": { "description": "徽标文字，不指定则不显示" },
    "tabbar-item/show-dot": { type: "boolean", "description": "是否显示红点" },
    "tabbar-item/link": { "description": "链接，可以为普通url或者用vue-link的路径写法，使用 object 写法指定 replace 为 true 可实现 replace 跳转" },
    "tabbar-item/icon-class": { "description": "图标类名，如果tabbar也同时定义了icon-class, 会使用tabbar-item的" },
    "tabbar-item/on-item-click": { type: "method", "description": "	点击菜单项时触发" },
    "x-header/left-options": { "options": ["{showBack: true, backText: '', preventGoBack: false}"], "description": "左侧参数" },
    "x-header/transition": { "description": "标题出现的动画" },
    "x-header/right-options": { "options": ["{showMore: false}"], "description": "右侧参数" },
    "x-header/on-click-more": { type: "method", "description": "点击右侧更多时触发" },
    "x-header/on-click-back": { type: "method", "description": "当left-options.preventGoBack为true,点击左边返回时触发" },
    "x-header/on-click-title": { type: "method", "description": "点击标题时触发" }
};
//# sourceMappingURL=vux.js.map