/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 7月 22日
 * 描       述：公共功能
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 9日
 ******************************************/

/**
 * 打开子窗口
 * @param url - 子窗口地址
 * @param params - 父窗口传给子窗口的参数
 * @param width - 子窗口宽度
 * @param height - 子窗口高度
 * @returns 子窗口传给父窗口的参数
 */
function openDialog(url, params, width, height) {
	var is_opera = /opera/i.test(navigator.userAgent);
	var is_ie = (/msie/i.test(navigator.userAgent) && !is_opera);
	var is_ie_6 = (is_ie && /msie 6\.0/i.test(navigator.userAgent));

	var value = "";
	if(is_ie_6) {
		height = height + 50;
		value = window.showModalDialog(url, params, "menubar:no;dialogWidth:" + width + "px;status:yes;title:no;help:no;resizable:no;scroll:yes;location:no;toolbar:no;dialogHeight:" + height + "px");
	} else {
		value = window.showModalDialog(url, params, "menubar:no;dialogWidth:" + width + "px;status:yes;title:no;help:no;resizable:no;scroll:yes;location:no;toolbar:no;dialogHeight:" + height + "px");
	}
	return value;
}

/**
 * 将xml字符串转换为dom对象
 * @param xmlStr - xml要转换的字符串对象
 * @returns dom对象
 */
function loadXMLStr(xmlStr) {
	var xmlDoc;
	try {
		if(window.ActiveXObject || window.ActiveXObject.prototype) {
			var activeX = ['Microsoft.XMLDOM', 'MSXML5.XMLDOM', 'MSXML.XMLDOM', 'MSXML2.XMLDOM', 'MSXML2.DOMDocument'];
			for(var i = 0; i < activeX.length; i++) {
				try {
					xmlDoc = new ActiveXObject(activeX[i]);
					xmlDoc.async = false;
					break;
				} catch(e) {
					continue;
				}
			}
			if(/http/ig.test(xmlStr.substring(0, 4))) {
				xmlDoc.load(xmlStr);
			} else {
				xmlDoc.loadXML(xmlStr);
			}
		} else if(document.implementation && document.implementation.createDocument) {
			xmlDoc = document.implementation.createDocument('', '', null);
			xmlDoc.loadXml(xmlStr);
		} else {
			xmlDoc = null;
		}
	} catch(exception) {
		xmlDoc = null;
	}

	return xmlDoc;
}

/**
 * 通过ID查找节点
 * @param xmlData-xml字符串或xml dom对象
 * @param id-要查找的节点的ID
 * @returns 查找到的节点
 */
function lookupNodeById(xmlData, id) {
	if(xmlData == undefined || xmlData == null) return null;

	var xmlDoc = null;
	if(typeof(xmlData) == "string") {
		xmlDoc = loadXMLStr(xmlData);
	} else {
		xmlDoc = xmlData;
	}

	var resultNode = null; //返回节点

	//判断当前元素
	var rootNode = xmlDoc.documentElement;

	if(rootNode != undefined) {
		for(var i = 0; rootNode.attributes != null && rootNode.attributes.length > 0 && i < rootNode.attributes.length; i++) {
			if(rootNode.attributes[i].name == "id" && rootNode.attributes[i].value == id) {
				resultNode = rootNode;
				return rootNode;
			}
		}
	} else {
		rootNode = xmlDoc;
	}

	for(var i = 0; rootNode != null && i < rootNode.childNodes.length; i++) {
		var node1 = rootNode.childNodes[i]; //子节点

		//判断当前元素
		if(node1.attributes != null && node1.attributes.length > 0) {
			for(var j = 0; j < node1.attributes.length; j++) {
				if(node1.attributes[j].name == "id" && node1.attributes[j].value == id) {
					resultNode = node1;
					break;
				}
			}
		}
		if(resultNode != null) break;

		//判断当前节点下的子元素
		if(node1.childNodes.length > 0) {
			resultNode = this.lookupNodeById(node1, id);
			if(resultNode != null) break;
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
function lookupNodeByName(xmlData, name) {
	if(xmlData == undefined || xmlData == null) return null;

	var xmlDoc = null;
	if(typeof(xmlData) == "string") {
		xmlDoc = loadXMLStr(xmlData);
	} else {
		xmlDoc = xmlData;
	}

	var resultNode = null; //返回节点

	//判断当前元素
	var rootNode = xmlDoc.documentElement;

	if(rootNode != undefined) {
		for(var i = 0; rootNode.attributes != null && rootNode.attributes.length > 0 && i < rootNode.attributes.length; i++) {
			if(rootNode.attributes[i].name == "name" && rootNode.attributes[i].value == name) {
				resultNode = rootNode;
				return rootNode;
			}
		}
	} else {
		rootNode = xmlDoc;
	}

	for(var i = 0; rootNode != null && i < rootNode.childNodes.length; i++) {
		var node1 = rootNode.childNodes[i]; //子节点

		//判断当前元素
		if(node1.attributes != null && node1.attributes.length > 0) {
			for(var j = 0; j < node1.attributes.length; j++) {
				if(node1.attributes[j].name == "name" && node1.attributes[j].value == name) {
					resultNode = node1;
					break;
				}
			}
		}
		if(resultNode != null) break;

		//判断当前节点下的子元素
		if(node1.childNodes.length > 0) {
			resultNode = this.lookupNodeByName(node1, name);
			if(resultNode != null) break;
		}
	}

	return resultNode;
}

/**
 * 功能：创建带有属性的Element节点
 * 参数：tagName-标签名；attrArr-属性列表；xmlDoc-添加的dom对象
 * 返回值：Element节点
 */
var createElementNode = function(tagName, attrArr, xmlDoc) {
	var elementNode = xmlDoc.createElement(tagName);
	if(attrArr != null) {
		for(var i = 0; i < attrArr.length; i++) {
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
var createElementText = function(tagName, textValue, xmlDoc) {
	var elementNode = xmlDoc.createElement(tagName);
	elementNode.text = textValue;
	return elementNode;
};

//将str字符串中的特殊字符去掉
//str:需要判断的字符串
//返回:没有特殊字符:返回legalInput字符串,有特殊字符返回截取后的字符串
var regStr = function(str, isPound) {
	if(isPound) {
		var pattern = new RegExp("[`~!@$^&*()=|{}':;',\\[\\].<>/?~！@￥……&*（）——|{}【】《》‘；：”“'。，、？?\\%]");
	} else {
		var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】《》‘；：”“'。，、？?\\%]");
	}
	var rs = "";
	for(var i = 0; i < str.length; i++) {
		rs = rs + str.substr(i, 1).replace(pattern, '');
	}
	if(rs == str) {
		return "legalInput";
	} else {
		return rs;
	}
}

/*
 *不允许thisobj输入特殊字符,将合格的字符串填充到thisObj中
 *@param thisObj 判断的dom对象
 *@param isPound 是否包含井号
 *@return true：满足 false：不满足
 */
var checkStr = function(thisObj, callback, isPound) {
	var whereValue = thisObj.value;
	var newValue = regStr(whereValue, isPound);
	if(newValue != "legalInput") {
		thisObj.value = newValue;
	}
};

/**
 *只允许输入数字以及小数点后两位
 *@param thisObj 判断的dom对象
 *@param { Boolean } [isPositive] [是否是正数]
 *@param { int } [decimalNum] [小数点后保留位数]
 *@param { num } [maxValue] [最大值限制]
 *@param callback 回调方法
 *@return true：满足 false：不满足
 */
function checkNum(thisObj, isPositive, decimalNum, maxValue, callback, isKeyUp) {
	//先定义一个输入框修改事件
	var propertyChangeEvent = function() {
		thisObj.onpropertychange = function() {
			if(isOpen) {
				isOpen = false;
				return;
			}
			checkNum(thisObj, isPositive, decimalNum, maxValue, callback);
		}
	}
	//增加isOpen开关-用于控制propertychange事件中修改propertychange值死循环调用的问题（解决堆栈溢出的bug）
	//update by zhangd 20170911
	var isOpen = true;
	if(!isKeyUp) {
		thisObj.onpropertychange = function() {};
	}
	var thisValue = thisObj.value;
	if(thisValue == undefined) { //输入值为null
		propertyChangeEvent();
		return;
	}
	var isInt = false;
	if(decimalNum != null && decimalNum == 0) { //是否为整数（小数点后保留0位小数）
		isInt = true;
	}
	if(isPositive) {
		if(isInt) { //正整数
			thisValue = thisValue.replace(/[^0-9]/g, '');
		} else { //正数
			thisValue = thisValue.replace(/[^0-9.]/g, '');
		}
	} else {
		if(isInt) { //正负整数
			thisValue = thisValue.replace(/[^0-9-]/g, '');
		} else { //正负数
			thisValue = thisValue.replace(/[^0-9.-]/g, '');
		}

		var isNegative = false;
		if(thisValue.indexOf("-") == 0) { //第一个字母为-号
			isNegative = true;
			thisValue = thisValue.toString().substr(1).replace(new RegExp(/(-)/g), ''); //删掉除了第一个字符外的所有的“-”号
		} else {
			isNegative = false;
			thisValue = thisValue.toString().replace(new RegExp(/(-)/g), ''); //删除所有“-”号
		}
	}

	if(thisValue.indexOf("0") == 0) { //输入第一位为0
		if(isInt) { //为整数时,直接置为0
			thisValue = 0;
			thisObj.value = thisValue;
			propertyChangeEvent();
			return;
		}
		var rightValue = thisValue.toString().substr(1);
		if(rightValue.indexOf(".") != 0) { //0后只能输入.
			thisValue = "0";
		}

	} else if(thisValue.indexOf(".") == 0) { //输入值中包括. 且.为第一个字母
		if(isNegative) { //负数
			thisObj.value = "-";
		} else {
			thisObj.value = "";
		}
		propertyChangeEvent();
		return;
	}

	var valueArr = thisValue.split(".");
	if(valueArr.length > 1) {
		if(decimalNum != null && decimalNum > 0 && valueArr[1].length > decimalNum) {
			thisValue = valueArr[0] + "." + valueArr[1].substr(0, decimalNum);
		} else {
			thisValue = valueArr[0] + "." + valueArr[1];
		}
	}

	//maxValue不为空时
	if(maxValue != undefined && maxValue.toString().indexOf("-") == -1 && parseFloat(thisValue) >= parseFloat(maxValue)) {
		thisValue = maxValue;
	}
	if(isNegative) { //负数加上负号
		thisValue = "-" + thisValue;
	}

	if(isNaN(thisValue)) {
		if(thisValue.indexOf(".") == 0) {
			thisObj.value = "";
			return;
		}
		var valueArr = thisValue.split(".");
		if(valueArr.length > 1) {
			thisValue = valueArr[0] + "." + valueArr[1];
		}
	}
	thisObj.value = thisValue;
	if(callback && typeof callback == "function") {
		callback(thisObj);
	}
	if(isKeyUp) {
		return;
	}
	propertyChangeEvent();
}

/**
 * 解析url字符串中传递过来的参数
 * @return {[type]} [description]
 */
var parseLocation = function() {
	var urlSegs = location.href.split("?");
	var params;
	var keyvalue = null;
	var results = {};
	if(urlSegs.length > 1) {
		params = urlSegs[1].split("&");
		for(var i = 0; i < params.length; i++) {
			keyvalue = params[i].split("=");
			results[keyvalue[0]] = keyvalue[1];
		}
	}
	return results;
};

/**
 * 点击颜色控件并且填充颜色在对应的input框里
 * @param  {[str]} id [input框的id]
 * @return {[type]}    [description]
 */
function fillColorDlg(id) {
	var sColor = null;
	var buttonNode = document.getElementById(id);
	if(buttonNode.previousSibling.previousSibling) {
		var inputNode = buttonNode.previousSibling.previousSibling;
	} else if(buttonNode.previousSibling) {
		var inputNode = buttonNode.previousSibling;
	} else {
		var inputNode = buttonNode;
	}
	sInitColor = inputNode.value;
	if(sInitColor == null) {
		sColor = dlgHelper.ChooseColorDlg();
	} else {
		sColor = dlgHelper.ChooseColorDlg(sInitColor);
	}
	sColor = sColor.toString(16);
	if(sColor.length < 6) {
		var sTempString = "00000000".substring(0, 6 - sColor.length);
		sColor = sTempString.concat(sColor);
	}
	sColor = "#" + sColor;
	if(id.indexOf("Sel") > -1) {
		var newId = id;
	} else {
		var newId = id.replace(/(fillColor)(.*)/, '$1Sel$2');
	}
	document.getElementById(newId).style["backgroundColor"] = sColor;
	inputNode.value = sColor;
}

/**
 * 从字段映射文件中获取到所需的名称
 * @param  {[string]} importName  [需要找映射的名称]
 * @param  {[string]} nodeName    [属于映射文件哪个节点]
 * @param  {[number]} importIndex [输入名称的索引:0,standardName；1,CaptionName; 2,FieldName]
 * @param  {[number]} exportIndex [输出名称索引]
 * @return {[type]}               [description]
 */
var getName = function(dom, importName, nodeName, importIndex, exportIndex) {
	if(!importName || !nodeName) {
		return importName;
	}
	if(importIndex < 0 || importIndex > 2 || !importIndex) {
		importIndex = 0;
	}
	if(exportIndex < 0 || exportIndex > 2) {
		exportIndex = 2;
	}
	var nameType = ["StandardName", "CaptionName", "FieldName"];
	var importType = nameType[importIndex];
	var exportType = nameType[exportIndex];
	var configXML = dom; //初始化得到的地质字段映射文件
	if(!configXML) {
		return importName;
	}
	var searchNode = configXML.getElementsByTagName(nodeName)[0] ? configXML.getElementsByTagName(nodeName)[0].getElementsByTagName("SystemFieldList")[0] : null;
	if(!searchNode) {
		return importName;
	}
	if(searchNode && searchNode.childNodes.length) {
		for(var i = searchNode.childNodes.length - 1; i >= 0; i--) {
			var item = searchNode.childNodes[i];
			if(item.getAttribute(importType).toUpperCase() == importName.toUpperCase()) {
				var returnValue = item.getAttribute(exportType);
				if(returnValue) {
					return returnValue;
				} else {
					return importName;
				}
			}
		}
	}
	return importName;
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