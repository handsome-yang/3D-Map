/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：二级菜单:菜单加载、菜单禁用、菜单切换等
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/

//获取浏览器放大缩小比率
var zoomInit = getZoom();//初始化时可以直接使用当前浏览器的缩放比例
var disabledButtonArr = []; //需禁用按钮数组
var toolBarHtmlArr = []; //二级菜单栏html数组
var lastClickMenu = null; //上一次点击的一级菜单的id
var earthToolWidth = Math.ceil(100 * zoomInit + 32); //宽
var earthToolHeight = Math.ceil(603 * zoomInit + 32); //高
var toolsNormalColor = "#fff"; //默认颜色

//设置二级菜单功能按钮状态（是否禁用，部分功能如无数据需禁用）
function setButtonStatus() {
	//判断二维相关按钮
	if(LayerManagement.mapLayers.length == 0 || !LayerManagement.mapLayers.length) {
		if($("#Map2D").length > 0) {
			Tools.setDisabled("Map2D");
		}
	} else {
		if($("#Map2D").length > 0) {
			Tools.cancelDisSingle("Map2D");
		}
	}
}

//菜单字符串：根据每个二级菜单获取拼接字符串
function strConsist(thisRecord, bFirstTool) {
	var strHtml = "";
	var strLength = thisRecord.name.length;

	strLength = strLength * 14 + 52;
	var strLength1 = strLength - 5;
	var border_radius = strLength1*0.2;
	strHtml += "<div style='display:inline;width:" + strLength + "px' title='" + thisRecord.title + "'>"
	var borderStyle = "<span style='height:22px; width:2px; border-left:2px #b3bdc7 solid;margin-top:3px;'></span>";
	strHtml += "<button class='defaultStyle' href='javascript:void(0)' style='width:" + strLength1 + "px;background-color: #434ae0;border-radius:" + border_radius + "px;margin:0 9.5px;' id='" +
		thisRecord.id + "' tag='" + thisRecord.id + "'>" +
		"<img style='height:18px;width:18px;' src='" + thisRecord.src + "' tag='" + thisRecord.id + "' /><span tag='" + thisRecord.id + "' style='margin-left:5px;color: #ffffff;'>" + thisRecord.name + "</span></button>" +
		"</div>";
	return strHtml;
}

//设置二级菜单上一页下一页按钮状态
function setToolsIconStatus() {
	// $("#nextMenu").hide();
	// $("#preMenu").hide();
	var scrollHeight = $("#toolBar_ios")[0].scrollHeight;
	var divHeight = $("#toolBar_ios").height();
	// if(scrollHeight > divHeight + 10) {
	// 	$("#nextMenu").removeClass("nextSgIcon");
	// 	$("#nextMenu").show();
	// }
}

/*功能：菜单显示
 * 参数：id一级菜单tag
 * 返回值：无
 */
function getTableObjectById(id) {
	var toolBar_ios = $("#toolBar_ios");
	if(lastClickMenu) {
		toolBarHtmlArr[lastClickMenu] = 1;
		$("#menu" + lastClickMenu).hide();
	}
	var isHtmlExist = false;
	if(toolBarHtmlArr.length) {
		for(var i in toolBarHtmlArr) {
			if(i == id) {
				isHtmlExist = true;
				break
			}
		}
	}
	if(isHtmlExist) {
		$("#menu" + id).show();
		setButtonStatus();
	} else {
		var index = id - 1;
		var menuCon = STAMP.menuConfig.menu[index];
		var strHtml = getToolBarHtml(menuCon, id);
		$(strHtml).appendTo("#toolBar_ios");
		setButtonStatus();

	}
	lastClickMenu = id;
	toolBar_ios.scrollTop(0); //防止有滚动条的记录
	setToolsIconStatus();
}

//动态拼接二级菜单栏字符串
function getToolBarHtml(menuCon, id) {
	var strHtml = "<div id='menu" + id + "'>";
	var strHtmlLength = 0;
	var bFirstIndex = true;
	for(var i = 0; i < menuCon.item.length; i++) {
		var thisRecord = menuCon.item[i];
		var strH = strConsist(thisRecord, bFirstIndex);
		bFirstIndex = false;
		strHtml += strH;
	}
	strHtml += "</div>";
	return strHtml;
}

/**
 * 点击菜单项，动态调用相应的函数
 * @param {Object} toolid  点击的元素id
 * @param {Object} toolsDiv  点击的元素对象
 */
function clickItem(toolid, toolsDiv) {
	earthToolsDiv = toolsDiv;
	try {
		if(typeof window[toolid + "Clicked"] == "function") {
			window[toolid + "Clicked"](toolid);
		} else {
			alert("请先定义" + toolid + "Clicked方法");
		}
	} catch(e) {
		alert(toolid + "Clicked方法异常！");
	}
}

function updateEarthToolsDiv(toolsDiv) {
	earthToolsDiv = toolsDiv;
}

//弹出工具栏菜单
function showEarthTools() {
	earthToolsBalloon = LayerManagement.earth.Factory.CreateHtmlBalloon(LayerManagement.earth.Factory.CreateGuid(), '功能菜单');
	earthToolsBalloon.SetScreenLocation('120', '30');
	earthToolsBalloon.SetRectSize(earthToolWidth, earthToolHeight);
	earthToolsBalloon.SetIsAddCloseButton(false);
	earthToolsBalloon.SetIsAddMargin(true);
	earthToolsBalloon.SetIsAddBackgroundImage(true);
	earthToolsBalloon.SetIsTransparence(false);
	earthToolsBalloon.SetBackgroundAlpha(0);
	var windowUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
	var url = windowUrl + '/earthTools.html';
	LayerManagement.earth.Event.OnDocumentReadyCompleted = function(guid) {
		if(guid == earthToolsBalloon.guid) {
			var funcPara = {};
			funcPara.clickItem = clickItem;
			funcPara.updateEarthToolsDiv = updateEarthToolsDiv;
			funcPara.earthToolHeight = Math.floor((earthToolHeight - 32) / zoomInit);
			earthToolsBalloon.InvokeScript('setFunc', funcPara);
		}
	}
	earthToolsBalloon.ShowNavigate(url);
	resizeEarthToolWindow();
}

/**
 * 定义工具对象
 */
var Tools = {
	setDisabled: function(id) {
		$("#" + id).addClass("disable");
		$("#" + id).attr("disabled", true);
		disabledButtonArr.push(id);
	},
	disableSingle: function(id) {
		if($.inArray(id, disabledButtonArr) >= 0) {
			return;
		}
		$("#" + id).addClass("disable");
		$("#" + id).attr("disabled", true);
	},
	cancelDisSingle: function(id) {
		if($.inArray(id, disabledButtonArr) >= 0) {
			return;
		}
		$("#" + id).removeClass("disable");
		$("#" + id).attr("disabled", false);
	},
	disabledAll: function(nonDisArr) {
		var aList = $("#toolBar_ios button");
		var len = aList.length;
		for(var i = 0; i < len; i++) {
			if($.inArray(aList[i].getAttribute("id"), nonDisArr) < 0) {
				var thisId = aList[i].getAttribute("id")
				aList[i].setAttribute("disabled", true);
				$("#" + thisId).addClass("disable");
			} else {
				continue;

			}
		}
	},
	cancelDisabled: function(disArr) {
		var aList = $("#toolBar_ios button");
		var len = aList.length;
		for(var i = 0; i < len; i++) {
			if($.inArray(aList[i].getAttribute("id"), disArr) < 0) {
				aList[i].removeAttribute("disabled");
				aList.removeClass("disable");
			} else {
				continue;
			}
		}
	},
	groupItemSelected: function(id, num) {
		var idArray = ["ViewTranSetting", "EffectRain", "EffectSnow", "EffectFog"];
		var showMode = ["ViewMaterialShowing", "ViewStandardColorShowing", "ViewCustomColorShowing"];
		var selectArray = '';
		if(num == 1) {
			selectArray = idArray;
		} else if(num == 2) {
			selectArray = showMode;
		}
		var len = selectArray.length;
		for(var i = 0; i < len; i++) {
			if(selectArray[i] == id) {
				$("#" + id).addClass('selected');
				$("#" + id).addClass('selectedStyle');
				$("#" + id).removeClass('defaultStyle');
			} else {
				$('#' + selectArray[i]).removeClass('selected');
				$('#' + selectArray[i]).removeClass('selectedStyle');
				$('#' + selectArray[i]).addClass('defaultStyle');
			}
		}
	},
	groupItemCancel: function(id) { // 取消选中状态之后的样式
		$("#" + id).removeClass('selected');
		$("#" + id).removeClass('selectedStyle');
		$("#" + id).add('defaultStyle');
	},
	toolBarGroupClick: function(command, num) {
		if($("#" + command).hasClass('selected')) {
			Tools.groupItemCancel(command);
			return false;
		} else {
			Tools.groupItemSelected(command, num);
			return true;
		}
	},
	singleItemSelected: function(id) {
		$("#" + id).addClass('selected');
	},
	singleItemCancel: function(id) {
		$("#" + id).removeClass('selected');
	},
	singleSelectedStyle: function(id) {
		$("#" + id).addClass('selected');
		$("#" + id).addClass('selectedStyle');
	},
	singleStyleCancel: function(id) {
		$("#" + id).removeClass('selected');
		$("#" + id).removeClass('selectedStyle');
	},
	toolBarItemClick: function(command) {
		if($("#" + command).hasClass('selected')) {
			$("#" + command).removeClass('selected');
			return false;
		} else {
			$("#" + command).addClass('selected');
			return true;
		}
	},
	toolBarItemClickStyle: function(command) {
		if($("#" + command).hasClass('selected') || (top.earthToolsDiv && top.earthToolsDiv.find("#" + command).attr("isChecked"))) {
			$("#" + command).removeClass('selected');
			$("#" + command).removeClass('selectedStyle');
			return false;
		} else {
			$("#" + command).addClass('selected');
			$("#" + command).addClass('selectedStyle');
			return true;
		}
	},
	legendShowClick: function() {
		var showMode = ["ViewMaterialShowing", "ViewStandardColorShowing", "ViewCustomColorShowing"];
		for(var i = 0; i < showMode.length; i++) {
			if($("#" + showMode[i]).hasClass("selected")) {
				return showMode[i];
			}
		}
	},
	getTransparency: function() {
		var toolTransObject = $("#ViewTranSetting");
		return toolTransObject;
	}
};

/**
 * 定义三级菜单对象，包含对菜单点击样式设置事件
 */
var ThreeMenu = {
	itemClickStyle: function(id) {
		var effctArr = ["EffectRain", "EffectSnow", "EffectFog"];
		if($.inArray(id, effctArr) >= 0) {
			if(top.earthToolsDiv && top.earthToolsDiv.find("#ViewTranSetting").attr("isChecked")) {
				earthToolsDiv.find("#ViewTranSetting").attr("isChecked", false);
				earthToolsDiv.find("#ViewTranSetting").removeAttr("isChecked");
				earthToolsDiv.find("#ViewTranSetting").find("img").attr("src", earthToolsDiv.find("#ViewTranSetting").find("img").attr("src").replace("active", "normal"));
			}
		}
		var thisObject = window.frames["operator"].$("#" + id);
		var thisImgSrc = thisObject.attr("src");
		var activeIndex = thisImgSrc.indexOf("/active");
		if(activeIndex > 0) {
			var imgSrcNow = thisImgSrc.replace("/active", "/inactive");
			thisObject.attr("src", imgSrcNow);
			return false;
		} else {
			var imgSrcNow = thisImgSrc.replace("/inactive", "/active");
			thisObject.attr("src", imgSrcNow);
			return true;
		}
	},
	setClickStyle: function(id) {
		var thisObject = window.frames["operator"].$("#" + id);
		if(thisObject.length < 1) {
			return;
		}
		var thisImgSrc = thisObject.attr("src");
		var activeIndex = thisImgSrc.indexOf("/inactive");
		if(activeIndex > 0) {
			var imgSrcNow = thisImgSrc.replace("/inactive", "/active");
			thisObject.attr("src", imgSrcNow);
		}
	},
	removeClickStyle: function(id) {
		var thisObject = window.frames["operator"].$("#" + id);
		if(thisObject.length < 1) {
			return;
		}
		var thisImgSrc = thisObject.attr("src");
		var activeIndex = thisImgSrc.indexOf("/active");
		if(activeIndex > 0) {
			var imgSrcNow = thisImgSrc.replace("/active", "/inactive");
			thisObject.attr("src", imgSrcNow);
		}
	},
	getClickStyle: function(id) {
		var thisObject = window.frames["operator"].$("#" + id);
		var thisImgSrc = thisObject.attr("src");
		var activeIndex = thisImgSrc.indexOf("/active");
		if(activeIndex > 0) {
			return true;
		} else {
			return false;
		}
	}
}

/**
 * 定义气泡对象，包含气泡样式设置的诸多方法
 */
var BalloonHtml = {
	itemClickStyle: function(id) {
		var thisObject = earthToolsDiv.find("#" + id).find("img");
		var flag = thisObject.attr("isChecked");
		if(flag) {
			thisObject.removeAttr("isChecked");
			thisObject.attr("src", thisObject.attr("src").replace("active", "normal"));
			earthToolsDiv.find("#" + id).find("span").css("color", "#fff");
		} else {
			thisObject.attr("isChecked", true);
			thisObject.attr("src", thisObject.attr("src").replace("normal", "active"));
			earthToolsDiv.find("#" + id).find("span").css("color", "#08f6fc");
		}
		return !flag;
	},
	getItemStyle: function(id) {
		var thisObject = earthToolsDiv.find("#" + id).find("img");
		var flag = thisObject.attr("isChecked");
		return !flag;
	},
	setItemStyle: function(id) {
		var thisObject = earthToolsDiv.find("#" + id).find("img");
		thisObject.attr("isChecked", true);
		thisObject.attr("src", thisObject.attr("src").replace("normal", "active"));
		earthToolsDiv.find("#" + id).find("span").css("color", "#08f6fc");
	},
	removeItemStle: function(id) {
		var thisObject = earthToolsDiv.find("#" + id).find("img");
		if(thisObject.attr("isChecked")) {
			thisObject.removeAttr("isChecked");
			thisObject.attr("src", thisObject.attr("src").replace("active", "normal"));
			earthToolsDiv.find("#" + id).find("span").css("color", "#fff");
		}
	}
}

/**
 * 页面加载完成事件
 */
$(document).ready(function() {
	$("#toolBar_ios").click(function(e) {
		var ev = null;
		if(e) {
			ev = e.target;
		} else {
			ev = window.event.srcElement;
		}

		var id = ev.getAttribute("tag");
		if(!id || id == "undefined" || id == null) {
			return;
		}

		if($("#" + id).attr("disabled") == true || $("#" + id).attr("disabled") == "disabled") {
			return;
		} else {
			try {
				if(typeof window[id + "Clicked"] == "function") {
					window[id + "Clicked"](id);
				} else {
					alert("请先定义" + id + "Clicked方法");
				}
			} catch(e) {
				alert(id + "Clicked方法异常！");
			}
		}
	});

	//下一页菜单
	$("#nextMenu").click(function() {
		var scrollHeight = $("#toolBar_ios")[0].scrollHeight;
		var scrollTopNow = $("#toolBar_ios").scrollTop();
		var scrollTopNext = scrollTopNow + 52;
		$("#toolBar_ios").scrollTop(scrollTopNext);
		// if((scrollTopNext + 44) > scrollHeight) {
		// 	$("#preMenu").removeClass("preSgIcon");
		// 	$("#nextMenu").hide();
		// } else {
		// 	$("#preMenu").addClass("preSgIcon");
		// 	$("#nextMenu").addClass("nextSgIcon")
		// }
		// $("#preMenu").show();
	});

	//上一页菜单
	$("#preMenu").click(function() {
		console.log('11')
		var scrollHeight = $("#toolBar_ios")[0].scrollHeight;
		var scrollTopNow = $("#toolBar_ios").scrollTop();
		var scrollTopNext = scrollTopNow - 52;
		// if((scrollTopNext - 30) < 0) {
		// 	$("#nextMenu").removeClass("nextSgIcon");
		// 	$("#preMenu").hide();
		// } else {
		// 	$("#preMenu").addClass("preSgIcon");
		// 	$("#nextMenu").addClass("nextSgIcon")
		// }
		$("#toolBar_ios").scrollTop(scrollTopNext);
		// $("#nextMenu").show();
	});

});