/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：公共文件
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
/* 屏蔽右键菜单 */
document.oncontextmenu = function() {
    event.returnValue = false;
};
/**
 * 打开子窗口
 * @param url - 子窗口地址
 * @param params - 父窗口传给子窗口的参数
 * @param width - 子窗口宽度
 * @param height - 子窗口高度
 * @returns 子窗口传给父窗口的参数
 */
function openDialog(url,params,width,height){
    var is_opera = /opera/i.test(navigator.userAgent);  
    var is_ie = (/msie/i.test(navigator.userAgent) && !is_opera);
    var is_ie_6 = (is_ie && /msie 6\.0/i.test(navigator.userAgent));
    
    var value = "";
    if(is_ie_6){
        height = height + 50;
        value = window.showModalDialog(url,params,"menubar:no;dialogWidth:"+width+"px;status:yes;title:no;help:no;resizable:no;scroll:yes;location:no;toolbar:no;dialogHeight:"+height+"px");
    }else{
        value = window.showModalDialog(url,params,"menubar:no;dialogWidth:"+width+"px;status:yes;title:no;help:no;resizable:no;scroll:yes;location:no;toolbar:no;dialogHeight:"+height+"px");
    }
    return value;
}

/**
 * 将xml字符串转换为dom对象
 * @param xmlStr - xml要转换的字符串对象
 * @returns dom对象
 */
function loadXMLStr(xmlStr){
	var xmlDoc;
	
	try {
		if (window.ActiveXObject || window.ActiveXObject.prototype) {
			var activeX = ['Microsoft.XMLDOM', 'MSXML5.XMLDOM', 'MSXML.XMLDOM', 'MSXML2.XMLDOM','MSXML2.DOMDocument'];
			for (var i=0; i<activeX.length; i++){
				xmlDoc = new ActiveXObject(activeX[i]);
				xmlDoc.async = false;
				break;
			}
			if (/http/ig.test(xmlStr.substring(0,4))){
				xmlDoc.load(xmlStr);
			}else{
				xmlDoc.loadXML(xmlStr);
			}
		} else if (document.implementation && document.implementation.createDocument) {
			xmlDoc = document.implementation.createDocument('', '', null);
			xmlDoc.loadXml(xmlStr);
		} else {
			xmlDoc = null;
		}
	}catch (exception){
		xmlDoc = null;
	}
		
	return xmlDoc;
}

/**
 * 将指定的XML文件转换为dom对象
 * @param file - XML文件
 * @returns dom对象
 */
function loadXMLFile(file){	
	var xmlDoc = null;
	if (window.ActiveXObject || window.ActiveXObject.prototype){
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
	}else if(document.implementation.createDocument){
		xmlDoc = document.implementation.createDocument("","",null);
	}else{
		alert("error");
	}
	if(xmlDoc != null){
		xmlDoc.async = false;
		xmlDoc.load(file);
	}
	return xmlDoc;
}
/**
 * 数据库服务操作通用功能
 * @param url 服务地址
 * @param xml POST内容：xml格式
 * @return {String} 直接返回服务所返回的内容：xml格式的字符串
 */
var dbUtil = function(url, xml) {
	var res = "";
	$.support.cors = true; //开启jQuery跨域支持
	$.ajaxSetup({
		async: false // 将ajax请求设为同步
	});
	$.post(url, xml, function(data) {
		res = data;
	}, "text");
	return res;
};
/**
 * 通过ID查找节点
 * @param xmlData-xml字符串或xml dom对象
 * @param id-要查找的节点的ID
 * @returns 查找到的节点
 */
function lookupNodeById(xmlData,id){
	if (xmlData == undefined || xmlData == null) return null;
	
	var xmlDoc = null;
	if (typeof(xmlData) == "string"){
		xmlDoc = loadXMLStr(xmlData);
	}else{
		xmlDoc = xmlData;
	}
	
	var resultNode = null;	//返回节点
	
	//判断当前元素
	var rootNode = xmlDoc.documentElement;
	
	if (rootNode!=undefined){
		for (var i=0; rootNode.attributes!=null && rootNode.attributes.length>0 && i<rootNode.attributes.length; i++){
			if (rootNode.attributes[i].name=="id" && rootNode.attributes[i].value==id){
				resultNode = rootNode;
				return rootNode;
			}
		}
	}else{
		rootNode = xmlDoc;
	}
	
	for (var i=0; rootNode!=null && i<rootNode.childNodes.length; i++){	
		var node1 = rootNode.childNodes[i];	//子节点
		
		//判断当前元素
		if (node1.attributes!=null && node1.attributes.length>0){
			for (var j=0; j<node1.attributes.length; j++){
				if (node1.attributes[j].name=="id" && node1.attributes[j].value==id){
					resultNode = node1;
					break;
				}
			}
		}
		if (resultNode != null) break;
		
		//判断当前节点下的子元素
		if (node1.childNodes.length > 0){
			resultNode = this.lookupNodeById(node1, id);
			if (resultNode != null) break;
		}
	}
	
	return resultNode;
}

/**
 * 通过Name查找节点
 * @param xmlData-xml字符串或xml dom对象
 * @param name-要查找的节点的Name
 * @returns 查找到的节点
 */
function lookupNodeByName(xmlData,name){
	if (xmlData == undefined || xmlData == null) return null;
	
	var xmlDoc = null;
	if (typeof(xmlData) == "string"){
		xmlDoc = loadXMLStr(xmlData);
	}else{
		xmlDoc = xmlData;
	}
	
	var resultNode = null;	//返回节点
	
	//判断当前元素
	var rootNode = xmlDoc.documentElement;
	
	if (rootNode!=undefined){
		for (var i=0; rootNode.attributes!=null && rootNode.attributes.length>0 && i<rootNode.attributes.length; i++){
			if (rootNode.attributes[i].name=="name" && rootNode.attributes[i].value==name){
				resultNode = rootNode;
				return rootNode;
			}
		}
	}else{
		rootNode = xmlDoc;
	}
	
	for (var i=0; rootNode!=null && i<rootNode.childNodes.length; i++){	
		var node1 = rootNode.childNodes[i];	//子节点
		
		//判断当前元素
		if (node1.attributes!=null && node1.attributes.length>0){
			for (var j=0; j<node1.attributes.length; j++){
				if (node1.attributes[j].name=="name" && node1.attributes[j].value==name){
					resultNode = node1;
					break;
				}
			}
		}
		if (resultNode != null) break;
		
		//判断当前节点下的子元素
		if (node1.childNodes.length > 0){
			resultNode = this.lookupNodeByName(node1, name);
			if (resultNode != null) break;
		}
	}
	
	return resultNode;
}

/**
 * 功能：创建带有属性的Element节点
 * 参数：tagName-标签名；attrArr-属性列表；xmlDoc-添加的dom对象
 * 返回值：Element节点
 */
var createElementNode = function(tagName,attrArr,xmlDoc){
	var elementNode = xmlDoc.createElement(tagName);
	if(attrArr != null){
		for(var i=0; i<attrArr.length; i++){
			var itemIndex = attrArr[i];
			elementNode.setAttribute(itemIndex.name, itemIndex.value);
		}
	}
	return elementNode;
};

/**
 * 功能：创建没有属性的Element节点
 * 参数：tagName-标签名；textValue-节点文字；xmlDoc-添加的dom对象
 * 返回值：Element节点
 */
var createElementText = function(tagName,textValue,xmlDoc){
	var elementNode = xmlDoc.createElement(tagName);
	elementNode.text = textValue;
	return elementNode;
};
/*遮罩层添加方法*/
function divload(tableId){
	var divHeight = $("#"+tableId).height();
	divHeight = divHeight/2;
    $("<div id='loadingdiv' style='text-align:center;padding-top:"+divHeight+"px;height:100%;width:100%;background:#eee;" +
		"filter:alpha(Opacity=60);-moz-opacity:0.6;opacity: 0.6; position:absolute; top:0px; left:0; z-index:2' >" +
		"<img src='../../images/dialog/dialogLoad.gif' style=''><span>页面加载中,请稍后</span></div>").appendTo("#"+tableId);
    $("#tabhead").css("visibility","visible");//解决ie11里面的表头重绘
}
/*去除遮罩层方法*/
function divloaded(){
   $("div#loadingdiv").remove();
}
var regWhere = function(str){
    var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】《》‘；：”“'。，、？?\\%]") 
	var rs = ""; 
    for (var i = 0; i < str.length; i++) {
        rs = rs+str.substr(i, 1).replace(pattern, ''); 
    } 
    if(rs==str){
    	return "legalInput";
    }else{
		return rs;
    }
}
var checkFilter = function(obj){
	var whereValue = obj.val();
    var newValue = regWhere(whereValue);
    if(newValue != "legalInput"){
        obj.val(newValue);
    }
}

var onlyPositiveNum = function(obj){
	var radiusValue = obj.val();
    if(radiusValue == 0 && radiusValue!=""){
        obj.val(0);
    }else{
        var replaceValue = radiusValue.replace(/\b(0+)/gi,"");
        if(radiusValue.length != replaceValue.length){
            obj.val(replaceValue);
        }
    }
}
/**
 * [将str字符串中的特殊字符去掉]
 * @param  {[string]}  str     [需要判断的字符串]
 * @param  {Boolean} isPound [是否允许输入井号]
 * @return {[返回legalInput字符串]}[没有特殊字符]
 * @return {[true]}[有特殊字符返回截取后的字符串]
 */
var regStr = function(str, isPound){
	if(isPound){
    	var pattern = new RegExp("[`~!@$^&*()=|{}':;',\\[\\].<>/?~！@￥……&*（）——|{}【】《》‘；：”“'。，、？?\\%]");
	}else{
    	var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】《》‘；：”“'。，、？?\\%]");
	}
    var rs = "";
    for (var i = 0; i < str.length; i++) {
        rs = rs+str.substr(i, 1).replace(pattern, '');
    }
    if(rs==str){
        return "legalInput";
    }else{
        return rs;
    }
}

/**
 *不允许thisobj输入特殊字符,将合格的字符串填充到thisObj中
 *@param thisObj 判断的dom对象
 *@param callback 回调方法
 *@return true：满足 false：不满足
 */
var checkStr = function(thisObj, callback, isPound){
	var isOpen = true;
	thisObj.onpropertychange = function(){};
    var whereValue = thisObj.value;
    var newValue = regStr(whereValue, isPound);
    if(newValue != "legalInput"){
        thisObj.value = newValue;
    }
    thisObj.onpropertychange = function(){
    	if(isOpen){
    		isOpen = false;
    		return;
    	}
    	if(callback && typeof callback == "function"){
    		callback(thisObj);
    	}else{
    		checkStr(thisObj,callback,isPound);	
    	}
    };
};

/**
 *只允许输入数字以及小数点后两位
 *@param thisObj 判断的dom对象
 *@param { Boolean } [isPositive] [是否是正数]
 *@param { int } [decimalNum] [小数点后保留位数]
 *@param { num } [maxValue] [最大值限制]
 *@param { function } callback 回调方法
 *@param { Boolean } isKeyUp 是否是keyup事件
 *@return true：满足 false：不满足
 */
function  checkNum(thisObj, isPositive, decimalNum, maxValue, callback, isKeyUp) {
	//先定义一个输入框修改事件
	var propertyChangeEvent = function(){
		thisObj.onpropertychange = function(){
			if(isOpen){
	    		isOpen = false;
	    		return;
	    	}
	    	checkNum(thisObj, isPositive, decimalNum, maxValue, callback);	
		}
	}

	//增加isOpen开关-用于控制propertychange事件中修改propertychange值死循环调用的问题（解决堆栈溢出的bug） 
	//update by zhangd 20170911
	var isOpen = true;
	if(!isKeyUp){
		thisObj.onpropertychange = function(){};	
	}
    var thisValue = thisObj.value;
    if(thisValue == undefined){//输入值为null
    	propertyChangeEvent();
    	return;
    }
    var isInt = false;
    if(decimalNum != null  && decimalNum == 0){//是否为整数（小数点后保留0位小数）
    	isInt = true;
    }
    if(isPositive){
    	if(isInt){//正整数
    		thisValue = thisValue.replace(/[^0-9]/g,'');
    	}else{//正数
    		thisValue = thisValue.replace(/[^0-9.]/g,'');
    	}
    }else{
    	if(isInt){//正负整数
    		thisValue = thisValue.replace(/[^0-9-]/g,'');
    	}else{//正负数
    		thisValue = thisValue.replace(/[^0-9.-]/g,'');
    	}
    	
    	var isNegative = false;
		if(thisValue.indexOf("-") == 0){//第一个字母为-号
			isNegative = true;
			thisValue = thisValue.toString().substr(1).replace(new RegExp(/(-)/g),'');//删掉除了第一个字符外的所有的“-”号
		}else{
			isNegative = false;
			thisValue = thisValue.toString().replace(new RegExp(/(-)/g),'');//删除所有“-”号
		}
    }

    if(thisValue.indexOf("0") == 0){//输入第一位为0
    	if(isInt){//为整数时,直接置为0
			thisValue = 0;
			thisObj.value = thisValue;
			propertyChangeEvent();
			return;	
		}
    	var rightValue = thisValue.toString().substr(1);
    	if(rightValue.indexOf(".") != 0){//0后只能输入.
    		thisValue = "0";
    	}
    }else if(thisValue.indexOf(".") == 0){//输入值中包括. 且.为第一个字母
		if(isNegative){//负数
			thisObj.value = "-";
		}else{
			thisObj.value = "";
		}
		propertyChangeEvent();
		return;
	}
	
	var valueArr = thisValue.split(".");
	if(valueArr.length > 1){
		if(decimalNum != null && decimalNum > 0 && valueArr[1].length > decimalNum){
			thisValue = valueArr[0] + "." + valueArr[1].substr(0, decimalNum);
		}else{
			thisValue = valueArr[0] + "." + valueArr[1];	
		}
	}

	//maxValue不为空时
	if(maxValue != undefined && maxValue.toString().indexOf("-") == -1 && parseFloat(thisValue) >= parseFloat(maxValue)){
		thisValue = maxValue;
	}

	if(isNegative){//负数加上负号
		thisValue = "-" + thisValue;
	}

    thisObj.value = thisValue;
    if(callback && typeof callback == "function"){
		callback(thisObj);
	}
	if(isKeyUp){
		return;	
	}
    propertyChangeEvent();
}

/*
 *设置统计模块dgDiv和resultDivScroll的高度
 */
function setGridScrollHeight() {
    var outerHeight = top.STAMP_config.height.bannerHeight+top.STAMP_config.height.toolHeight;
    var minusHeight = outerHeight + $(".cardTitle").height() + $("#southDiv").height() + $("#northDiv").height();
    var divHeight = $(parent.document).height() - minusHeight;
    $("#dgDiv").height(divHeight);
    $("#resultDivScroll").height(divHeight - $("#tabhead").height());
    $("#resultDivScroll").mCustomScrollbar({});
}

/*
 *设置分析模块dgDiv和resultDiv的高度
 */
function setDivHeight() {
    var outerHeight = top.STAMP_config.height.bannerHeight+top.STAMP_config.height.toolHeight;
    var minusHeight = outerHeight + $(".cardTitle").height() + $("#southDiv").height() + $("#northDiv").height();
    var divHeight = $(parent.document).height() - minusHeight;
    $("#dgDiv").height(divHeight);
    $("#resultDiv").height(divHeight - $("#tabhead").height());
    $("#resultDiv").mCustomScrollbar({});
}

/*
 *设置查询以及覆土分析模块的dg的高度
 */
function setGidDivHeight() {
    var outerHeight = top.STAMP_config.height.bannerHeight+top.STAMP_config.height.toolHeight;
    var minusHeight = outerHeight + $(".cardTitle").height() + $("#southDiv").height() + $("#northDiv").height() ;
    var divHeight = $(parent.document).height() - minusHeight;
    $("#dg").height(divHeight);
}

/*
 *设置控高分析和退让分析的表格高度
 */
function setGidOuterDivHeight() {
    var outerHeight = top.STAMP_config.height.bannerHeight+top.STAMP_config.height.toolHeight;
    var minusHeight = outerHeight + $(".cardTitle").height() + $("#southDiv").height() + $("#northDiv").height() ;
    var divHeight = $(parent.document).height() - minusHeight;
    $("#dgDiv").height(divHeight);
}

// 判断pc浏览器是否缩放，若返回1则为默认无缩放，如果大于1则是放大，否则缩小
function getZoom (){
	var ratio = 0;
	var screen = window.screen;
	var ua = navigator.userAgent.toLowerCase();

	if (window.devicePixelRatio !== undefined) {
		ratio = window.devicePixelRatio;
	}else if (~ua.indexOf('msie')) {
		if (screen.deviceXDPI && screen.logicalXDPI) {
			ratio = screen.deviceXDPI / screen.logicalXDPI;
		}
	}else if (window.outerWidth !== undefined && window.innerWidth !== undefined) {
		ratio = window.outerWidth / window.innerWidth;
	}

   	return ratio;
}