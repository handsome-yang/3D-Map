/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：观察点添加和修改页面脚本
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

//验证输入是否正确
function validate(){
	if(lookatName.value == ""){
		alert("请输入名称");
		lookatName.focus();
		return false;
	}
	if(longitude.value == ""){
		alert("请输入经度");
		longitude.focus();
		return false;
	}
	var longitudeNum = Number(longitude.value);
	if(isNaN(longitudeNum) == true){
		alert("无效的经度值");
		longitude.select();
		longitude.focus();
		return false;
	}
	if(longitudeNum < -180 || longitudeNum > 180){
		alert("经度值超出范围");
		longitude.select();
		longitude.focus();
		return false;
	}
	if(latitude.value == ""){
		alert("请输入纬度");
		latitude.focus();
		return false;
	}
	var latitudeNum = Number(latitude.value);
	if(isNaN(latitudeNum) == true){
		alert("无效的纬度值");
		latitude.select();
		latitude.focus();
		return false;
	}
	if(latitudeNum < -90 || latitudeNum > 90){
		alert("纬度值超出范围");
		latitude.select();
		latitude.focus();
		return false;
	}
	if(altitude.value == ""){
		alert("请输入高程");
		altitude.focus();
		return false;
	}
	var altitudeNum = Number(altitude.value);
	if(isNaN(altitudeNum) == true){
		alert("无效的高程值");
		altitude.select();
		altitude.focus();
		return false;
	}
	if(heading.value == ""){
		alert("请输入朝向");
		heading.focus();
		return false;
	}
	var headingNum = Number(heading.value);
	if(isNaN(headingNum) == true){
		alert("无效的朝向值");
		heading.select();
		heading.focus();
		return false;
	}
	if(headingNum < 0 || headingNum > 360){
		alert("朝向值超出范围");
		heading.select();
		heading.focus();
		return false;
	}
	if(tilt.value == ""){
		alert("请输入俯仰角");
		tilt.focus();
		return false;
	}
	var tiltNum = Number(tilt.value);
	if(isNaN(tiltNum) == true){
		alert("无效的俯仰角值");
		tilt.select();
		tilt.focus();
		return false;
	}
	if(tiltNum < -90 || tiltNum > 90){
		alert("俯仰角超出范围");
		tilt.select();
		tilt.focus();
		return false;
	}

	var rollNum = Number(roll.value);
	if(roll.value == ""){
		alert("请输入旋转角");
		roll.focus();
		return false;
	}
	if(rollNum < 0 || rollNum > 360){
		alert("旋转角超出范围");
		roll.select();
		roll.focus();
		return false;
	}
	if(isNaN(rollNum) == true){
		alert("无效的旋转角值");
		roll.select();
		roll.focus();
		return false;
	}

	if(range.value == ""){
		alert("请输入距离");
		range.focus();
		return false;
	}
	var rangeNum = Number(range.value);
	if(isNaN(rangeNum) == true){
		alert("无效的距离值");
		range.select();
		range.focus();
		return false;
	}
	if(time.value == ""){
		alert("请输入飞行时间");
		time.focus();
		return false;
	}
	var timeNum = Number(time.value);
	if(isNaN(timeNum) == true){
		alert("无效的飞行时间值");
		time.select();
		time.focus();
		return false;
	}
	if(stopTime.value == ""){
		alert("请输入停滞时间");
		stopTime.focus();
		return false;
	}
	var stopTimeNum = Number(stopTime.value);
	if(isNaN(stopTimeNum) == true){
		alert("无效的停滞时间值");
		stopTime.select();
		stopTime.focus();
		return false;
	}
	return true;
}

//确定
function confirm(){
	if(validate()){
        window.returnValue = {
            name : lookatName.value,
            Longitude : longitude.value,
            Latitude : latitude.value,
            Altitude : altitude.value,
            Heading: heading.value,
            Tilt : tilt.value,
            Roll : roll.value,
            Range : range.value,
            Time : time.value,
            StopTime : stopTime.value
        };
        window.close();
	}
}

//初始化输入框值
function init(){
	var data = window.dialogArguments;
	if(data){
        lookatName.value = data.name || '观察点';
        longitude.value = data.Longitude || 0;
        latitude.value = data.Latitude || 0;
        altitude.value = data.Altitude?data.Altitude.toFixed(2) : 0;
        heading.value = data.Heading?data.Heading.toFixed(2): 0;
        tilt.value = data.Tilt?data.Tilt.toFixed(2):0;
        roll.value = data.Roll || 0;
        range.value = data.Range || 100;
        time.value = data.Time || 5;
        stopTime.value = data.StopTime ||5;
	}
}