var vm = new Vue({
    el: '#app',
    data: function() {
        return {
            CanvasImageHide: true,
            showToast: false,
            avatar: ''
        };
    },
    mounted: function() {
        this.$nextTick(function() {
            var _this = this;
            new QRCode(document.getElementById('qrcode'), '你怎么这么帅？？');
            // 用base64展示html中要显示的图片（如果这个图片地址是服务端链接，图片链接需要服务端允许跨域，本地图片可以不用转base64）
            // 因为直接使用服务端地址链接，canvas.toDataUrl API抛出异常：
            // Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported. ==> 受污染的画布不能导出
            var imgUrl1 = 'https://upload.jianshu.io/users/upload_avatars/14483412/f102fb78-bd3d-4600-8016-bc6f6f2ce608.jpg?imageMogr2/auto-orient/strip|imageView2/1/w/120/h/120';
            _this.imgTobase64(imgUrl1, 'Anonymous').then(function(res) {
                _this.avatar = res;
            });
        });
    },
    methods: {
        /**
         * 根据 window.devicePixelRatio 获取像素比
         * @returns {number}
         */
        changeDpr: function() {
            if (window.devicePixelRatio && window.devicePixelRatio > 1) {
                return window.devicePixelRatio;
            }
            return 1;
        },


        // 将图片转为base64格式
        imgTobase64: function(url, crossOrigin) {
            return new Promise(resolve => {
                const img = new Image();

                img.onload = () => {
                    const c = document.createElement('canvas');

                    c.width = img.naturalWidth;
                    c.height = img.naturalHeight;

                    const cxt = c.getContext('2d');

                    cxt.drawImage(img, 0, 0);

                    // 得到图片的base64编码数据
                    resolve(c.toDataURL('image/png'));
                };

                // 结合合适的CORS响应头，实现在画布中使用跨域<img>元素的图像
                crossOrigin && img.setAttribute('crossOrigin', crossOrigin);
                img.src = url;
            });
        },

        /**
         * 生成图片
         */
        createImage: function() {
            var _this = this;

            // 获取想要转换的dom节点
            // var dom = document.getElementById('app');
            var dom = _this.$refs.app;
            var box = window.getComputedStyle(dom);

            // 显示导出需要样式
            _this.$refs.scanText.style.opacity = '1'

            // dom节点计算后宽高,转为整数
            var width = parseInt(box.width, 10);
            var height = parseInt(box.height, 10);

            // 获取像素比
            var scaleBy = _this.changeDpr();

            // 创建自定义的canvas元素
            var canvas = document.createElement('canvas');

            // 设置canvas元素属性宽高为 DOM 节点宽高 * 像素比
            canvas.width = width * scaleBy;
            canvas.height = height * scaleBy;

            // 设置canvas css 宽高为DOM节点宽高
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            // 获取画笔
            var context = canvas.getContext('2d');

            // 将所有绘制内容放大像素比倍
            context.scale(scaleBy, scaleBy);

            // 设置需要生成的图片的大小，不限于可视区域（即可保存长图）
            var w = dom.style.width;
            var h = dom.style.height;

            html2canvas(dom, {
                allowTaint: true,
                width: w,
                height: h,
                useCORS: true
            }).then(function(canvas) {
                // 将canvas转换成图片渲染到页面上
                var url = canvas.toDataURL('image/png');// base64数据
                var image = new Image();
                image.src = url;
                document.getElementById('shareImg').appendChild(image);
                // 隐藏按钮
                _this.CanvasImageHide = false;
                // 给渲染后图片大小全屏
                var shareImgElem = document.getElementById('shareImg');
                shareImgElem.style.height = '100%'
            });
        }
    }
});
