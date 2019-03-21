### 1.需求
由于在最近在做的项目需要用到在前端把页面生成图片并保存到手机中，在技术调用过程中自己写了一个demo，没有采用vue-cli脚手架，但是大同小异，这个demo也采用了vue2.js开发页面，qrcode.js来生成二维码，原理比较简单。该demo项目：[github地址](https://github.com/bayi-lzp/html2canvas_vue) ，觉得有帮助的给一个星，万分感谢。该项目不能直接打开index.html进行访问，会出现报错。请用 ```http-server``` 打开，不明白怎么配置可参考[http-server开启本地服务](https://www.jianshu.com/p/462b1a8c7861)


##### 具体的需求如下：
1. 获取后台信息，得出排名和用户图像

2.点击保存按钮，把改页面生成图片

3.长按保存图片或扫描二维码

 ![image.png](https://upload-images.jianshu.io/upload_images/14483412-ccd40f4265e5057f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![image.png](https://upload-images.jianshu.io/upload_images/14483412-3d5ba1dbd735a3ae.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![image.png](https://upload-images.jianshu.io/upload_images/14483412-b9f246d06cad83b9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 2.思路
1.  html2canvas.js：可将 htmldom 转为 canvas 元素。
2.  canvasAPI：toDataUrl() 可将 canvas 转为 base64 格式
3.  在微信浏览器中，长按img，会弹起actionsheet，可以进行保存、发送、识别二维码等操作
### 3.代码分析
#####  解决图片模糊
在pc端开发时生成图片没有问题，但是在移动端会出现模糊的情况，主要原因是像素比的问题。
> 设备像素比 (简称 dpr) 定义了物理像素和设备独立像素的对应关系，它的值可以按如下的公式的得到：
设备像素比 = 物理像素 / 设备独立像素 // 在某一方向上，x方向或者y方向

解决代码：
```
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
```
####解决图片不显示问题
如果引用没有跨域配置的图片地址会出现一下报错
```
 Uncaught (in promise) DOMException: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported.
```
尽管不通过 CORS 就可以在画布中使用图片，但是这会污染画布。一旦画布被污染，你就无法读取其数据。例如，你不能再使用画布的 toBlob(), toDataURL() 或 getImageData() 方法，调用它们会抛出安全错误。
HTML 规范中图片有一个 `[crossorigin](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img#attr-crossorigin)` 属性，结合合适的 [CORS](https://developer.mozilla.org/en-US/docs/Glossary/CORS "CORS: CORS (Cross-Origin Resource Sharing) is a system, consisting of transmitting HTTP headers, that determines whether browsers block frontend JavaScript code from accessing responses for cross-origin requests.") 响应头，就可以实现在画布中使用跨域 [`<img>`](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/img "HTML Image 元素（ <img> ）代表文档中的一个图像。") 元素的图像。

解决代码如下：
```
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
        }
```
####生成图片
图片生成是利用canvas来进行获取并生成图片，有些需求需要导出长图，可以改动一下代码
```
 // 设置需要生成的图片的大小，不限于可视区域（即可保存长图）
            var w = dom.style.width;
            var h = dom.style.height;
```
由于部分需求并不需要显示个别的元素，可以利用 ```data-html2canvas-ignore```来进行忽略。如果在开始渲染不显示，可以把它的透明度进行变化，在转化之前设置为1即可。
下载后的图片会覆盖整个页面，即长按就可以调用actionsheet进行操作。
代码如下：
```
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
```



