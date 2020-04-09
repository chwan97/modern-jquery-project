// import $ from "jquery";
import { nowDate } from '../../index/getDate/getDate';
import AMapLoader from '@amap/amap-jsapi-loader';

AMapLoader.load({
  "key": "eacb363ab596206d3f3933a6c16f7a3d",   // 申请好的Web端开发者Key，首次调用 load 时必填
  "version": "2.0",   // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
  "plugins": []  //插件列表
}).then((AMap)=>{
  const map = new AMap.Map('map-container', {
    zoom: 15,  //设置地图显示的缩放级别
    center: [116.39, 39.9],//设置地图中心点坐标mapStyle: 'amap://styles/whitesmoke',  //设置地图的显示样式
    viewMode: '2D',  //设置地图模式
  });
  // 创建一个 Marker 实例：
  var marker = new AMap.Marker({
    position: new AMap.LngLat(116.39, 39.9),   // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
    title: '厂房地址'
  });
  map.add(marker);
}).catch(e => {
  console.log(e);
})

