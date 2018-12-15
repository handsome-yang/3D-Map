/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月10日
 * 描    述：添加模型
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */

var userdataObj = window.dialogArguments;
var earth = userdataObj.earth;
var isSubmit = false;

var usbFormatStr = "(*.usb)|*.usb|";
var usbFormat = "usb";

var usxFormatStr = "(*.usx)|*.usx";
var usxFormat = "usx";

var usbAndUsxFormatStr = "(*.usb)|*.usb;|(*.usx)|*.usx";
var usbAndUsxFormat = "usb,usx";

var shpFormatStr = "(*.shp)|*.shp";
var shpFormat = "shp";

var formatStr;
var format;

/**
 * 提交
 * @return {[type]} [description]
 */
function model_submit(){
	isSubmit = true;
	var modelUtil;
	
	if(check()) {
		if(userdataObj != null) {
            document.getElementById("link").disabled = true;
            document.getElementById("shplink").disabled = true;
            document.getElementById("submitAdd").disabled = true;
            document.getElementById("clear").disabled = true;
			userdataObj.click="true";
            userdataObj.link = document.getElementById("link").value;
            userdataObj.shplink = document.getElementById("shplink").value;
			window.close();
		}
	}
}

/**
 * 检查
 * @return {[type]} [description]
 */
function check(){
	var link = document.getElementById("link").value;
	if("" == link){
		alert("请选择模型文件！");
		return false;
	}
	var shplink = document.getElementById("shplink").value;
	if("" == shplink){
		alert("请选择模型基地文件！");
		return false;
	}
	return true;
}

/**
 * 取消
 * @return {[type]} [description]
 */
function model_close(){
	isSubmit = false;
	userdataObj.click="false";
	window.close();
}

/**
 * 窗口卸载
 * @return {[type]} [description]
 */
function unloadWindow(){
    if(!isSubmit){
        userdataObj.click="false";
    }
}

/**
 * 添加模型文件
 */
function addLink(){
	//第三个参数设置为true时 可以多选 但是有问题 窗口模态显示问题!
	var fileName = earth.UserDocument.OpenFileDialog(earth.Environment.RootPath, formatStr);
	if(fileName == "")return;
	var fileType = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
	if(format.indexOf(fileType)>-1){
		document.getElementById("link").value = fileName;
        if(document.getElementById("shplink").value){
        	document.getElementById("submitAdd").disabled = false;
        }
	}else{
		alert("格式不正确，支持格式为:"+ format);
	}
}

/**
 * 添加矢量基底面文件
 */
function addShpLink(){
	//第三个参数设置为true时 可以多选 但是有问题 窗口模态显示问题!
	var fileName = earth.UserDocument.OpenFileDialog(earth.Environment.RootPath, shpFormatStr);
	if(fileName == "") {
		return;
	}
	var fileType = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
	if(shpFormat.indexOf(fileType)>-1){
		document.getElementById("shplink").value = fileName;
        if(document.getElementById("link").value){
        	document.getElementById("submitAdd").disabled = false;
        }
	}else{
		alert("格式不正确，支持格式为:"+ format);
	}
}

/**
 * 页面初始化加载
 * @return {[type]} [description]
 */
function attribute(){
	switch(userdataObj.flag){
		case  "model" ://目前只有模型，其他类型后面扩展
			formatStr = usbFormatStr;
			format = usbFormat;
			break;
		case  "tree" :
			formatStr = usxFormatStr;
			format = usxFormat;
			break;
		case  "match" :
			formatStr = usbAndUsxFormatStr;
			format = usbAndUsxFormat;
			break;
	}

	if("add" == userdataObj.action){
		return;
	}else if("edit" == userdataObj.action){
		document.getElementById("link").value = userdataObj.link;
        document.getElementById("submitAdd").disabled = false;
	}
}