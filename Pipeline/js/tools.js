/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：二级菜单点击、样式切换
 * 遗留bug ：无
 * 修改日期：2017年11月8日
 **************************************************/

 //获取浏览器放大缩小比率
var zoomInit = getZoom();//初始化时可以直接使用当前浏览器的缩放比例
var disabledButtonArr = [];//禁用的按钮id集合
var toolBarHtmlArr = [];//二级菜单栏html数组
var lastClickMenu = null;//上一次点击的一级菜单的id
var earthToolWidth = Math.ceil(60 * zoomInit + 32);//工具栏气泡的宽度
var earthToolHeight = Math.ceil(402 * zoomInit + 32);//工具栏气泡的高度
var toolsActiveColor = "#08f6fc";//工具栏被选中的字颜色
var toolsNormalColor = "#fff";//工具栏正常的字颜色

$(document).ready(function () {
    /**
     * 二级菜单的点击事件代理
     * @param  {[object]} e 被点击对象
     */
    $("#toolBar_ios").click(function (e) {
        var ev = null;
        if (e) {
            ev = e.target;
        } else {
            ev = window.event.srcElement;
        }
        var id = ev.getAttribute("tag");
        if (!id || id == "undefined" || id == null) {
            return;
        }
        if ($("#" + id).attr("disabled") == true || $("#" + id).attr("disabled") == "disabled") {
            return;
        } else {
            try {
                if (typeof window[id + "Clicked"] == "function") {
                    clearLRBDownEvent();
                    window[id + "Clicked"](id);
                } else {
                    alert("请先定义" + id + "Clicked方法");
                }
            } catch (e) {
                alert(id + "Clicked方法异常！");
            }
        }
    });

    /**
     * 关闭图层点击事件
     */
    $("#closeLayer").click(function () {
        bLayerVisible = false;
        setLayerShow(false);//缩进图层面板
        if (earthToolsDiv) {
            BalloonHtml.removeItemStyle("LayerManager");
        }
    });

    /**
     * 下一页点击事件
     */
    $("#nextMenu").click(function () {
        var scrollHeight = $("#toolBar_ios")[0].scrollHeight;
        var scrollTopNow = $("#toolBar_ios").scrollTop();
        var scrollTopNext = scrollTopNow + 34;
        $("#toolBar_ios").scrollTop(scrollTopNext);
        if ((scrollTopNext + 44) > scrollHeight) {
            $("#preMenu").removeClass("preSgIcon");
            $("#nextMenu").hide();
        } else {
            $("#preMenu").addClass("preSgIcon");
            $("#nextMenu").addClass("nextSgIcon")
        }
        $("#preMenu").show();
    });

    /**
     * 上一页点击事件
     */
    $("#preMenu").click(function () {
        var scrollHeight = $("#toolBar_ios")[0].scrollHeight;
        var scrollTopNow = $("#toolBar_ios").scrollTop();
        var scrollTopNext = scrollTopNow - 34;
        if ((scrollTopNext - 30) < 0) {
            $("#nextMenu").removeClass("nextSgIcon");
            $("#preMenu").hide();
        } else {
            $("#preMenu").addClass("preSgIcon");
            $("#nextMenu").addClass("nextSgIcon")
        }
        $("#toolBar_ios").scrollTop(scrollTopNext);
        $("#nextMenu").show();
    });

});
/**
 * 设置二级菜单功能按钮状态
 */
function setButtonStatus() {
    //判断二维相关按钮
    var mapLayer = top.LayerManagement.getMapLayers();
    if (mapLayer.length == 0 || !mapLayer.length) {
        if ($("#ViewHawkEye").length > 0) {
            Tools.setDisabled("ViewHawkEye");
        }
        if ($("#ViewLink").length > 0) {
            Tools.setDisabled("ViewLink");
        }
        if ($("#ViewFullScreen2D").length > 0) {
            Tools.setDisabled("ViewFullScreen2D");
        }
    } else {
        if ($("#ViewHawkEye").length > 0) {
            Tools.cancelDisSingle("ViewHawkEye");
        }
        if ($("#ViewLink").length > 0) {
            Tools.cancelDisSingle("ViewLink");
        }
        if ($("#ViewFullScreen2D").length > 0) {
            Tools.cancelDisSingle("ViewFullScreen2D");
        }
    }

    //判断重点管线相关按钮
    var importLines = top.LayerManagement.importPipeLines;
    if (importLines.length == 0 || !importLines.length) {
        if ($("#AnalysisManagerRange").length > 0) {
            Tools.setDisabled("AnalysisManagerRange");
        }
        if ($("#AnalysisProtectRange").length > 0) {
            Tools.setDisabled("AnalysisProtectRange");
        }
    } else {
        if ($("#AnalysisManagerRange").length > 0) {
            Tools.cancelDisSingle("AnalysisManagerRange");
        }
        if ($("#AnalysisProtectRange").length > 0) {
            Tools.cancelDisSingle("AnalysisProtectRange");
        }
    }

    //判断埋设统计是否配置 建设年代字段
    var statusEnabled = top.getName("US_BD_TIME", 1, true);
    if (!statusEnabled) {
        if ($("#StatisticsInbuilt").length > 0) {
            Tools.setDisabled("StatisticsInbuilt");
        }
    } else {
        if ($("#StatisticsInbuilt").length > 0) {
            Tools.cancelDisSingle("StatisticsInbuilt");
        }
    }

    //判断权属字段是否配置
    var statusEnabled = top.getName("US_OWNER", 1, true);
    if (!statusEnabled) {
        if ($("#StatisticsOwner").length > 0) {
            Tools.setDisabled("StatisticsOwner");
        }
        if ($("#QueryOwner").length > 0) {
            Tools.setDisabled("QueryOwner");
        }
    } else {
        if ($("#StatisticsOwner").length > 0) {
            Tools.cancelDisSingle("StatisticsOwner");
        }
        if ($("#QueryOwner").length > 0) {
            Tools.cancelDisSingle("QueryOwner");
        }
    }
    //判断使用状态是否配置
    var statusEnabled = top.getName("US_STATUS", 1, true);
    var statusEnabledPoint = top.getName("US_STATUS", 0, true);
    if (!statusEnabled && !statusEnabledPoint) {
        if ($("#QueryAbandon").length > 0) {
            Tools.setDisabled("QueryAbandon");
        }
        if ($("#StatisticsAbandon").length > 0) {
            Tools.setDisabled("StatisticsAbandon");
        }
    } else {
        if ($("#QueryAbandon").length > 0) {
            Tools.cancelDisSingle("QueryAbandon");
        }
        if ($("#StatisticsAbandon").length > 0) {
            Tools.cancelDisSingle("StatisticsAbandon");
        }
    }

    //根据是否配置了行政、道路表对一部分二级菜单设置禁用
    if ($.inArray("canton", top.areaTable) < 0) {
        if ($("#StatisticsCanton").length > 0) {
            Tools.setDisabled("StatisticsCanton");
        }
    } else {
        if ($("#StatisticsCanton").length > 0) {
            Tools.cancelDisSingle("StatisticsCanton");
        }
    }

    if ($.inArray("road", top.areaTable) < 0) {
        if ($("#ViewRoadName").length > 0) {
            Tools.setDisabled("ViewRoadName");
        }
        if ($("#QueryRoad").length > 0) {
            Tools.setDisabled("QueryRoad");
        }
        if ($("#StatisticsRoad").length > 0) {
            Tools.setDisabled("StatisticsRoad");
        }
        if ($("#QueryCross").length > 0) {
            Tools.setDisabled("QueryCross");
        }
    } else {
        if ($("#ViewRoadName").length > 0) {
            Tools.cancelDisSingle("ViewRoadName");
        }
        if ($("#QueryRoad").length > 0) {
            Tools.cancelDisSingle("QueryRoad");
        }
        if ($("#StatisticsRoad").length > 0) {
            Tools.cancelDisSingle("StatisticsRoad");
        }
        if ($("#QueryCross").length > 0) {
            Tools.cancelDisSingle("QueryCross");
        }
    }
}

/**
 * 菜单字符串：根据每个二级菜单获取拼接字符串
 * @param  {[object]} thisRecord [此二级菜单对象]
 * @return {[string]}  strHtml   [一个二级菜单的html字符串]
 */
function strConsist(thisRecord) {
    var strHtml = "";
    var strLength = thisRecord.name.length;

    strLength = strLength * 14 + 52;
    var strLength1 = strLength - 2;
    strHtml += "<div style='display:inline;width:" + strLength + "px' title='" + thisRecord.title + "'>"
    var borderStyle = "<span style='height:22px; width:2px; border-left:2px #b3bdc7 solid;margin-top:3px;'></span>";
    strHtml += "<button class='defaultStyle' href='javascript:void(0)' style='width:" + strLength1 + "px' id='"
        + thisRecord.id + "' tag='" + thisRecord.id + "'>"
        + "<img style='height:18px;width:18px;' src='" + thisRecord.src + "' tag='" + thisRecord.id + "' /><span tag='" + thisRecord.id + "' style='margin-left:5px;'>" + thisRecord.name + "</span></button>"
        + borderStyle
        + "</div>";
    return strHtml;
}

/**
 * 设置二级菜单上一页下一页的状态
 */
function setToolsIconStatus() {
    $("#nextMenu").hide();
    $("#preMenu").hide();
    var scrollHeight = $("#toolBar_ios")[0].scrollHeight;
    var divHeight = $("#toolBar_ios").height();
    if (scrollHeight > divHeight + 10) {
        $("#nextMenu").removeClass("nextSgIcon");
        $("#nextMenu").show();
    }
}

/*功能：菜单显示
 * 参数：id一级菜单tag
 * 返回值：无
 */
function getTableObjectById(id) {
    var toolBar_ios = $("#toolBar_ios");
    if (lastClickMenu) {
        toolBarHtmlArr[lastClickMenu] = 1;
        $("#menu" + lastClickMenu).hide();
    }
    var isHtmlExist = false;
    if (toolBarHtmlArr.length) {
        for (var i in toolBarHtmlArr) {
            if (i == id) {
                isHtmlExist = true;
                break
            }
        }
    }
    if (isHtmlExist) {
        $("#menu" + id).show();
        if (isProjectChanged) {
            setButtonStatus();
        }
    } else {
        var index = id - 1;
        var menuCon = cpPs.config.menu[index];
        var strHtml = getToolBarHtml(menuCon, id);
        $(strHtml).appendTo("#toolBar_ios");
        setButtonStatus();
    }
    lastClickMenu = id;
    toolBar_ios.scrollTop(0);//防止有滚动条的记录
    setToolsIconStatus();
}

/**
 * 动态拼接二级菜单栏字符串
 * @param  {[obejct]} menuCon [菜单内容json数组]
 * @param  {[number]} id      [第几个一级菜单]
 * @return {[string]} strHtml       [二级菜单字符串]
 */
function getToolBarHtml(menuCon, id) {
    var strHtml = "<div id='menu" + id + "'>";
    var strHtmlLength = 0;
    var bFirstIndex = true;
    for (var i = 0; i < menuCon.item.length; i++) {
        var thisRecord = menuCon.item[i];
        var strH = strConsist(thisRecord, bFirstIndex);
        bFirstIndex = false;
        strHtml += strH;
    }
    strHtml += "</div>";
    return strHtml;
}

/**
 * 判断当前点击的二级菜单方法是否存在于nav-tool.js中
 * @param  {[string]} toolid   [点击的菜单id]
 * @param  {[object]} toolsDiv [工具栏]
 */
function clickItem(toolid, toolsDiv) {
    earthToolsDiv = toolsDiv;
    try {
        if (typeof window[toolid + "Clicked"] == "function") {
            window[toolid + "Clicked"](toolid);
        } else {
            alert("请先定义" + toolid + "Clicked方法");
        }
    } catch (e) {
        alert(toolid + "Clicked方法异常！");
    }
}

/**
 * 主要是在工具栏html中调用此方法，有元素变化之后将此变量变化
 */
function updateEarthToolsDiv(toolsDiv) {
    earthToolsDiv = toolsDiv;
}

/**
 * 弹出工具栏菜单
 */
function showEarthTools() {
    earthToolsBalloon = LayerManagement.earth.Factory.CreateHtmlBalloon(LayerManagement.earth.Factory.CreateGuid(), '功能菜单');
    earthToolsBalloon.SetScreenLocation(0, 0);
    earthToolsBalloon.SetRectSize(earthToolWidth, earthToolHeight);
    earthToolsBalloon.SetIsAddCloseButton(false);
    earthToolsBalloon.SetIsAddMargin(true);
    earthToolsBalloon.SetIsAddBackgroundImage(true);
    earthToolsBalloon.SetIsTransparence(false);
    earthToolsBalloon.SetBackgroundAlpha(0);
    var windowUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    var url = windowUrl + '/earthTools.html';
    LayerManagement.earth.Event.OnDocumentReadyCompleted = function (guid) {
        if (guid == earthToolsBalloon.guid) {
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
 * 封装的一系列关于二级菜单禁用、选中效果
 * @type {Object}
 */
var Tools = {
    /**
     * 设置禁用
     * @param id 二级菜单id
     */
    setDisabled: function (id) {
        $("#" + id).addClass("disable");
        $("#" + id).attr("disabled", true);
        disabledButtonArr.push(id);
    },
    /**
     * 取消禁用
     * @param id 二级菜单id
     */
    cancelDisSingle: function (id) {
        $("#" + id).removeClass("disable");
        $("#" + id).attr("disabled", false);
    },
    /**
     * 禁用所有
     * @param nonDisArr 不需要禁用的id集合
     */
    disabledAll: function (nonDisArr) {
        var aList = $("#toolBar_ios button");
        var len = aList.length;
        for (var i = 0; i < len; i++) {
            if ($.inArray(aList[i].getAttribute("id"), nonDisArr) < 0) {
                var thisId = aList[i].getAttribute("id")
                aList[i].setAttribute("disabled", true);
                $("#" + thisId).addClass("disable");
            } else {
                continue;

            }
        }
    },
    /**
     * 取消禁用所有
     * @param disArr 需要被禁用的
     */
    cancelDisabled: function (disArr) {
        var aList = $("#toolBar_ios button");
        var len = aList.length;
        for (var i = 0; i < len; i++) {
            if ($.inArray(aList[i].getAttribute("id"), disArr) < 0) {
                aList[i].removeAttribute("disabled");
                aList.removeClass("disable");
            } else {
                continue;
            }
        }
    },
    /**
     * 分组点击，一组中最多允许一个被点击
     * @param id 二级菜单的id
     * @param num 属于第几组
     * @returns {boolean} true:该按钮没被点击过,false:按钮之前已经被点击了
     */
    groupItemSelected: function (id, num) {
        if ($("#" + id).hasClass("selected")) {
            $("#" + id).removeClass('selected');
            $("#" + id).removeClass('selectedStyle');
            $("#" + id).addClass('defaultStyle');
            return false;
        }
        var idArray = ["ViewTranSetting", "EffectRain", "EffectSnow", "EffectFog"];
        var showMode = ["ViewMaterialShowing", "ViewStandardColorShowing", "ViewCustomColorShowing"];
        var measureArr = ["MeasureHorizontalDis", "MeasureVerticalDis", "MeasureSpaceDis", "MeasureFlatArea", "MeasurePlaneAngle", "MeasurePipelineHorDis", "MeasurePipelineVerDis", "MeasurePipelineSpaceDis"];
        var selectArray = '';
        if (num == 1) {
            selectArray = idArray;
        } else if (num == 2) {
            selectArray = showMode;
        } else if (num == 3) {
            selectArray = measureArr;
        }
        var len = selectArray.length;
        for (var i = 0; i < len; i++) {
            if (selectArray[i] == id) {
                $("#" + id).addClass('selected');
                $("#" + id).addClass('selectedStyle');
                $("#" + id).removeClass('defaultStyle');
            } else {
                $('#' + selectArray[i]).removeClass('selected');
                $('#' + selectArray[i]).removeClass('selectedStyle');
                $('#' + selectArray[i]).addClass('defaultStyle');
            }
        }
        return true;
    },
    /**
     * 取消点击样式
     * @param id 二级菜单id
     */
    groupItemCancel: function (id) {
        $("#" + id).removeClass('selected');
        $("#" + id).removeClass('selectedStyle');
        $("#" + id).add('defaultStyle');
    },
    /**
     * 加上点击样式
     * @param id 二级菜单id
     */
    singleSelectedStyle: function (id) {
        $("#" + id).addClass('selected');
        $("#" + id).addClass('selectedStyle');
    },
    /**
     * 取消点击样式
     * @param id 二级菜单id
     */
    singleStyleCancel: function (id) {
        $("#" + id).removeClass('selected');
        $("#" + id).removeClass('selectedStyle');
    },
    /**
     * 点击加上样式或者去掉样式
     * @param command 点击二级菜单的Id
     * @returns {boolean} 之前没被点击:true，之前被点击:false
     */
    toolBarItemClickStyle: function (command) {
        if ($("#" + command).hasClass('selected') || (top.earthToolsDiv && top.earthToolsDiv.find("#" + command).attr("isChecked"))) {
            $("#" + command).removeClass('selected');
            $("#" + command).removeClass('selectedStyle');
            return false;
        } else {
            $("#" + command).addClass('selected');
            $("#" + command).addClass('selectedStyle');
            return true;
        }
    }
};
/**
 * 菜单栏的点击效果切换
 * @type {Object}
 */
var BalloonHtml = {
    itemClickStyle: function (id) {
        var thisObject = earthToolsDiv.find("#" + id).find("img");
        var flag = thisObject.attr("isChecked");
        if (flag) {
            thisObject.removeAttr("isChecked");
            thisObject.attr("src", thisObject.attr("src").replace("active", "normal"));
            earthToolsDiv.find("#" + id).find("span").css("color", toolsNormalColor);
        } else {
            thisObject.attr("isChecked", true);
            thisObject.attr("src", thisObject.attr("src").replace("normal", "active"));
            earthToolsDiv.find("#" + id).find("span").css("color", toolsActiveColor);
        }
        return !flag;
    },
    getItemStyle: function (id) {
        var thisObject = earthToolsDiv.find("#" + id).find("img");
        var flag = thisObject.attr("isChecked");
        return !flag;
    },
    setItemStyle: function (id) {
        var thisObject = earthToolsDiv.find("#" + id).find("img");
        thisObject.attr("isChecked", true);
        thisObject.attr("src", thisObject.attr("src").replace("normal", "active"));
        earthToolsDiv.find("#" + id).find("span").css("color", toolsActiveColor);
    },
    removeItemStyle: function (id) {
        var thisObject = earthToolsDiv.find("#" + id).find("img");
        if (thisObject.attr("isChecked")) {
            thisObject.removeAttr("isChecked");
            thisObject.attr("src", thisObject.attr("src").replace("active", "normal"));
            earthToolsDiv.find("#" + id).find("span").css("color", toolsNormalColor);
        }
    }
}
