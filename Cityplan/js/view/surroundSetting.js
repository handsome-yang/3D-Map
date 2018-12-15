/**
 * 作    者：StampGIS Team
 * 创建日期：2017年8月29日
 * 描    述：环绕点添加和修改页面脚本
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

//验证输入是否合格
function validate() {
    if (surrName.value == "") {
        alert("请输入名称");
        surrName.focus();
        return false;
    }
    if (longitude.value == "") {
        alert("请输入经度");
        longitude.focus();
        return false;
    }
    var longitudeNum = Number(longitude.value);
    if (isNaN(longitudeNum) == true) {
        alert("无效的经度值");
        longitude.select();
        longitude.focus();
        return false;
    }
    if (longitudeNum < -180 || longitudeNum > 180) {
        alert("经度值超出范围");
        longitude.select();
        longitude.focus();
        return false;
    }
    if (latitude.value == "") {
        alert("请输入纬度");
        latitude.focus();
        return false;
    }
    var latitudeNum = Number(latitude.value);
    if (isNaN(latitudeNum) == true) {
        alert("无效的纬度值");
        latitude.select();
        latitude.focus();
        return false;
    }
    if (latitudeNum < -90 || latitudeNum > 90) {
        alert("纬度值超出范围");
        latitude.select();
        latitude.focus();
        return false;
    }
    if (altitude.value == "") {
        alert("请输入高程");
        altitude.focus();
        return false;
    }
    var altitudeNum = Number(altitude.value);
    if (isNaN(altitudeNum) == true) {
        alert("无效的高程值");
        altitude.select();
        altitude.focus();
        return false;
    }
    if (flyHeight.value == "") {
        alert("请输入高度");
        flyHeight.focus();
        return false;
    }
    var flyHeightNum = Number(flyHeight.value);
    if (isNaN(flyHeightNum) == true) {
        alert("无效的高度值");
        flyHeight.select();
        flyHeight.focus();
        return false;
    }
    if (flyHeightNum < 0 || flyHeightNum > 10000) {
        alert("请输入0-10000的高度值");
        flyHeight.select();
        flyHeight.focus();
        return false;
    }
    if (radius.value == "") {
        alert("请输入半径");
        radius.focus();
        return false;
    }
    var radiusNum = Number(radius.value);
    if (isNaN(radiusNum) == true) {
        alert("无效的半径值");
        radius.select();
        radius.focus();
        return false;
    }
    if (count.value == "") {
        alert("请输入圈数");
        count.focus();
        return false;
    }
    var countNum = Number(count.value);
    if (isNaN(countNum) == true) {
        alert("无效的圈数值");
        count.select();
        count.focus();
        return false;
    }
    if (speed.value == "") {
        alert("请输入飞行速度");
        speed.focus();
        return false;
    }
    var speedNum = Number(speed.value);
    if (isNaN(speedNum) == true) {
        alert("无效的飞行速度值");
        speed.select();
        speed.focus();
        return false;
    }
    return true;
}

//确定点击事件
function confirm() {
    if (validate()) {
        window.returnValue = {
            name: surrName.value,
            Longitude: longitude.value,
            Latitude: latitude.value,
            Altitude: altitude.value,
            FlyHeight: flyHeight.value,
            Radius: radius.value,
            NumberOfCycle: count.value,
            Speed: speed.value
        };
        window.close();
    }
}

//初始化
function init() {
    var data = window.dialogArguments;
    if (data) {
        surrName.value = data.name || '环绕点';
        longitude.value = data.Longitude || 0
        latitude.value = data.Latitude || 0;
        altitude.value = data.Altitude ? data.Altitude.toFixed(2) : 0;
        flyHeight.value = data.FlyHeight == undefined ? 100 : data.FlyHeight;
        radius.value = data.Radius || 200;
        count.value = data.NumberOfCycle || 1;
        speed.value = data.Speed || 10;
    }
}