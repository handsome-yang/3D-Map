/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月8日
 * 描    述：二级菜单和工具栏相关方法
 * 注意事项：只用于存放二级菜单栏和工具栏相关方法
 * 遗留bug ：无
 * 修改日期：2017年11月8日
 */

//获取浏览器放大缩小比率
var zoomInit = getZoom();//初始化时可以直接使用当前浏览器的缩放比例

jQuery.support.cors = true;//开启跨域访问
var menuList = [];//如果有权限设置，则需要从stampmanager获取，暂时设置为空
var toolBarHtmlArr = [];//用于保存二级菜单栏的html
var lastClickMenu = null;//上一次点击的一级菜单tag
var disabledButtonArr = [];//存放禁用按钮的数组
var earthToolWidth = Math.ceil(60 * zoomInit + 32);//工具栏宽度
var earthToolHeight = Math.ceil(468 * zoomInit + 32);//工具栏高度
var toolsActiveColor = "#08f6fc";//选中的工具栏颜色
var toolsNormalColor = "#fff";//未选中的工具栏颜色
/************************************二级菜单栏 START**************************************************/
/**
 * 菜单字符串：根据每个二级菜单获取拼接字符串
 * @param  {[type]} thisRecord [工具栏菜单对象]
 * @return {[type]}            [description]
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
 * 动态拼接二级菜单栏字符串
 * @param  {[array]} menuCon  [所有菜单对象]
 * @param  {[string]} menuList [菜单列表：目前暂时为空未用到，后面如需修改权限要用到]
 * @param  {[string]} id       [菜单ID]
 * @return {[string]}          [菜单html字符串]
 */
function getToolBarHtml(menuCon, menuList, id) {
    var strHtml = "<div id='menu" + id + "'>";
    var strHtmlLength = 0;
    for (var i = 0; i < menuCon.item.length; i++) {
        var thisRecord = menuCon.item[i];
        var strH = strConsist(thisRecord);
        strHtml += strH;
    }
    strHtml += "</div>";
    return strHtml;
}

//设置按钮状态
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

/**
 * 切换一级菜单，根据一级菜单ID显示它下面的所有二级菜单项
 * @param  {[type]}  id      [一级菜单ID]
 * @return {[type]}          [description]
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
        setBtnDisabled();
    } else {
        var index = id - 1;
        var menuCon = lefts.config.menu[index];
        var strHtml = getToolBarHtml(menuCon, menuList, id);
        $(strHtml).appendTo("#toolBar_ios");
        setBtnDisabled();
    }
    lastClickMenu = id;
    toolBar_ios.scrollTop(0);//防止有滚动条的记录
    setToolsIconStatus();
}

/**
 * 设置审批按钮状态
 * @param  {[type]} bFlag [审批状态标示]
 * @return {[type]}       [description]
 */
function approveDisableState(bFlag) {
    if (bFlag == 0) {//未审批或结束审批
        top.setBtnDisabled(true, "terrainSmooth");
        top.setBtnDisabled(true, "divChangeHeight");
        top.setBtnDisabled(true, "approveTag");
        top.setBtnDisabled(true, "attachment");
        top.setBtnDisabled(true, "buildingIndex");
        top.setBtnDisabled(true, "divContrastProject");
        top.setBtnDisabled(true, "heightControl");
        top.setBtnDisabled(true, "redLine");
    } else if (bFlag == 1) {//审批中未勾选方案和专题等
        top.setBtnDisabled(false, "terrainSmooth");
        top.setBtnDisabled(false, "divChangeHeight");
        top.setBtnDisabled(false, "approveTag");
        top.setBtnDisabled(false, "attachment");
        top.setBtnDisabled(true, "buildingIndex");
        top.setBtnDisabled(false, "divContrastProject");
        top.setBtnDisabled(true, "heightControl");
        top.setBtnDisabled(true, "redLine");
    } else if (bFlag == 2) {//审批中勾选方案
        top.setBtnDisabled(false, "terrainSmooth");
        top.setBtnDisabled(false, "divChangeHeight");
        top.setBtnDisabled(false, "approveTag");
        top.setBtnDisabled(false, "attachment");
        top.setBtnDisabled(false, "buildingIndex");
        top.setBtnDisabled(false, "divContrastProject");
        top.setBtnDisabled(false, "heightControl");
        top.setBtnDisabled(false, "redLine");
    } else if (bFlag == 3) {//审批中勾选专题
        top.setBtnDisabled(false, "terrainSmooth");
        top.setBtnDisabled(false, "divChangeHeight");
        top.setBtnDisabled(false, "approveTag");
        top.setBtnDisabled(false, "attachment");
        top.setBtnDisabled(true, "buildingIndex");
        top.setBtnDisabled(false, "divContrastProject");
        top.setBtnDisabled(true, "heightControl");
        top.setBtnDisabled(true, "redLine");
    }
    setEditBtnDisabled();
}

/**
 * 设置方案编辑模块的菜单按钮状态
 */
function setEditBtnDisabled() {
    top.setBtnDisabled(!top.editState, "editPosition");
    top.setBtnDisabled(!top.editState, "editProgramme");
    top.setBtnDisabled(!top.editState, "editFloor");
    top.setBtnDisabled(!top.editState, "editBasal");
    top.setBtnDisabled(!top.editState, "delete");
    top.setBtnDisabled(!top.editState, "replaceTexture");
    top.setBtnDisabled(!top.editState, "simplebuilding");
    top.setBtnDisabled(!top.editState, "importAlbuginea");
    top.setBtnDisabled(!top.editState, "addAlbuginea");
    top.setBtnDisabled(!top.editState, "importModel");
    top.setBtnDisabled(!top.editState, "model");
}


/**
 * 辅助规划按钮状态
 * @return {[type]} [description]
 */
function aidedPlanDisableState() {
    if (top.ctrPlanLayer.length === 0 || top.indicatorAccountingLayer.length === 0) {
        top.setBtnDisabled(true, "highLimit");
    } else {
        top.setBtnDisabled(false, "highLimit");
    }

    if (top.indicatorAccountingLayer.length === 0) {
        top.setBtnDisabled(true, "quotaAccount");
    } else {
        top.setBtnDisabled(false, "quotaAccount");
    }

    if (top.removeAnalysisLayer.length === 0) {
        top.setBtnDisabled(true, "demolition");
    } else {
        top.setBtnDisabled(false, "demolition");
    }

    if (top.greenbeltAnalysisLayer.length === 0) {
        top.setBtnDisabled(true, "greenLandAly");
    } else {
        top.setBtnDisabled(false, "greenLandAly");
    }

    if (top.surroundingLayer.length === 0) {
        top.setBtnDisabled(true, "complexQuery");
        top.setBtnDisabled(true, "keywordQuery");
        top.setBtnDisabled(true, "spatialQuery");
    } else {
        top.setBtnDisabled(false, "complexQuery");
        top.setBtnDisabled(false, "keywordQuery");
        top.setBtnDisabled(false, "spatialQuery");
    }

    if(top.ctrPlanLayer.length === 0){
        top.setBtnDisabled(true, "selectPlace");
        top.setBtnDisabled(true, "balance")
    } else {
        top.setBtnDisabled(false, "selectPlace");
        top.setBtnDisabled(false, "balance")
    }
}

/**
 * 所有菜单禁用
 * @param  {Boolean} isDisable [description]
 * @return {[type]}            [description]
 */
function disableAll(isDisable) {
    $("#DB_navi").attr("disabled", isDisable);
    $(".topImg").attr("disabled", isDisable);
}

/**
 * 为Array数组注册indexOf方法
 * @return {[type]} [description]
 */
function funcIndexOf() {
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (elt) {
            var len = this.length >>> 0;
            var from = Number(arguments[1]) || 0;
            from = (from < 0)
                ? Math.ceil(from)
                : Math.floor(from);
            if (from < 0)
                from += len;
            for (; from < len; from++) {
                if (from in this &&
                    this[from] === elt)
                    return from;
            }
            return -1;
        };
    }
}

/**
 * 菜单按钮的禁用
 * @param {[bool]} bShow [是否禁用]
 * @param {[type]} id    [功能菜单ID]
 */
function setBtnDisabled(bShow, id) {
    if (bShow && $.inArray(id, disabledButtonArr) == -1) {
        disabledButtonArr.push(id);
    } else if (!bShow && $.inArray(id, disabledButtonArr) >= 0) {
        funcIndexOf();
        disabledButtonArr.splice(disabledButtonArr.indexOf(id), 1);
    }
    $("#" + id).attr("disabled", bShow);
    if (bShow) {
        $("#" + id).css("color", "#cccccc");
    }
    else {
        $("#" + id).css("color", "#000");
    }
    if (lefts.config.menu == undefined) {
        return;
    }
    for (var i = 0; i < lefts.config.menu.length; i++) {
        if (id == lefts.config.menu[i].id) {
            lefts.config.menu[i].disabled = bShow;
            return;
        }
        if (lefts.config.menu[i].item == undefined) {
            continue;
        }
        for (var j = 0; j < lefts.config.menu[i].item.length; j++) {
            if (id == lefts.config.menu[i].item[j].id) {
                lefts.config.menu[i].item[j].disabled = bShow;
                return;
            }
            if (lefts.config.menu[i].item[j].item == undefined) {
                continue;
            }
            for (var k = 0; k < lefts.config.menu[i].item[j].item.length; k++) {
                if (id == lefts.config.menu[i].item[j].item[k].id) {
                    lefts.config.menu[i].item[j].item[k].disabled = bShow;
                    return;
                }
            }
        }
    }
}

//下一页菜单
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

//上一页菜单
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

//工具栏按钮点击事件
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
        if(window[id + "Clicked"] && typeof window[id + "Clicked"] == "function"){
            window[id + "Clicked"](id);    
        }else{
            alert("请先定义" + id + "Clicked方法");
        }
    }
});
/************************************二级菜单栏 END**************************************************/

/************************************工具栏 START**************************************************/
/**
 * 工具栏的点击方法
 * @param  {[string]} toolid   [工具栏菜单ID]
 * @param  {[object]} toolsDiv [工具栏DIV对象]
 * @return {[type]}          [description]
 */
function clickItem(toolid, toolsDiv) {
    earthToolsDiv = toolsDiv;
    if (window[toolid + "Clicked"] && typeof window[toolid + "Clicked"] == "function") {
        window[toolid + "Clicked"](toolid);
    } else {
        alert("请先定义" + toolid + "Clicked方法");
    }
}

/**
 * 更新工具栏DIV对象
 * @param  {[object]} toolsDiv [工具栏DIV对象]
 * @return {[type]}          [description]
 */
function updateEarthToolsDiv(toolsDiv) {
    earthToolsDiv = toolsDiv;
}

/**
 * 弹出工具栏菜单
 * @return {[type]} [description]
 */
function showEarthTools() {
    var windowUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    var url = windowUrl + '/earthTools.html';

    if(earthToolsBalloon){
        earthToolsBalloon.DestroyObject();
        earthToolsBalloon = null;
    }

    earthToolsBalloon = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), '功能菜单');
    earthToolsBalloon.SetScreenLocation(0, 0);
    earthToolsBalloon.SetRectSize(earthToolWidth, earthToolHeight);
    earthToolsBalloon.SetIsAddCloseButton(false);
    earthToolsBalloon.SetIsAddMargin(true);
    earthToolsBalloon.SetIsAddBackgroundImage(true);
    earthToolsBalloon.SetIsTransparence(false);
    earthToolsBalloon.SetBackgroundAlpha(0);

    earth.Event.OnDocumentReadyCompleted = function (guid) {
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
/************************************工具栏 END**************************************************/

/************************************二级菜单栏对象Tools START************************************************************/
//封装成对象—二级菜单点击等方法
var Tools = {
    /**
     * 禁用菜单按钮
     * @param  {[array]} nonDisArr [不禁用的按钮，其他按钮都需要禁用]
     * @return {[type]}           [description]
     */
    disabledAll: function (nonDisArr) {
        disableAll(true);
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
     * 取消禁用
     * @param  {[array]} disArr [仍需禁用的按钮，其他按钮都取消禁用]
     * @return {[type]}        [description]
     */
    cancelDisabled: function (disArr) {
        disableAll(false);
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
     * 多个菜单分为一组，设置其中一个按钮选中，其他按钮不选中
     * @param  {[string]} id  [选中的菜单ID]
     * @param  {[int]} num [分组号]
     * @return {[bool]}     [true：选中；false：取消选中]
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
        var measureArr = ["mHorizontalDis", "mVerticalDis", "mSpaceDis", "mFlatArea", "mSurfaceArea", "mPlaneAngle"];
        var pictureHtmlArr = ["Coordinate", "screenShot", "pictures"];
        var selectArray = '';
        if (num == 1) {//1为地形透明、雨雪雾分组
            selectArray = idArray;
        } else if (num == 2) {//2为管线颜色显示
            selectArray = showMode;
        } else if (num == 3) {//3为测量的按钮
            selectArray = measureArr;
        } else if (num == 4) {//4为坐标获取、屏幕截图、2.5D出图
            selectArray = pictureHtmlArr;
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
     * 组中菜单取消选择
     * @param  {[string]} id [菜单ID]
     * @return {[type]}    [description]
     */
    groupItemCancel: function (id) { // 取消选中状态之后的样式
        $("#" + id).removeClass('selected');
        $("#" + id).removeClass('selectedStyle');
        $("#" + id).add('defaultStyle');
    },
    /**
     * 设置选中菜单状态
     * @param  {[string]} id [菜单ID]
     * @return {[type]}    [description]
     */
    singleSelectedStyle: function (id) {
        $("#" + id).addClass('selected');
        $("#" + id).addClass('selectedStyle');
    },
    /**
     * 取消选中状态
     * @param  {[string]} id [菜单ID]
     * @return {[type]}    [description]
     */
    singleStyleCancel: function (id) {
        $("#" + id).removeClass('selected');
        $("#" + id).removeClass('selectedStyle');
    },
    /**
     * 设置二级菜单按钮选中或非选中样式，并返回选中状态结果
     * @param  {[string]} command [二级菜单ID]
     * @return {[bool]}         [true：选中；false：未选中]
     */
    toolBarItemClickStyle: function (command) {
        if ($("#" + command).hasClass('selected') || (earthToolsDiv && earthToolsDiv.find("#" + command).attr("isChecked"))) {
            $("#" + command).removeClass('selected');
            $("#" + command).removeClass('selectedStyle');
            return false;
        } else {
            $("#" + command).addClass('selected');
            $("#" + command).addClass('selectedStyle');
            return true;
        }
    },
    /**
     * 获取菜单项样式（二级菜单或者工具栏菜单）
     * @param  {[string]} command [菜单ID]
     * @return {[bool]}         [true:选中；false：未选中]
     */
    getItemStyle: function (command) {
        if ($("#" + command).hasClass('selected') || (earthToolsDiv && earthToolsDiv.find("#" + command).attr("isChecked"))) {
            return true;
        } else {
            return false;
        }
    }
}
/*******************************二级菜单栏对象Tools END***************************************/

/*******************************工具栏对象BalloonHtml START*****************************************/
//工具栏封装对象
var BalloonHtml = {
    /**
     * 菜单点击状态修改
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
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
    /**
     * 获取菜单选中状态
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
    getItemStyle: function (id) {
        var thisObject = earthToolsDiv.find("#" + id).find("img");
        var flag = thisObject.attr("isChecked");
        return !flag;
    },
    /**
     * 选中工具栏菜单
     * @param {[type]} id [description]
     */
    setItemStyle: function (id) {
        var thisObject = earthToolsDiv.find("#" + id).find("img");
        thisObject.attr("isChecked", true);
        thisObject.attr("src", thisObject.attr("src").replace("normal", "active"));
        earthToolsDiv.find("#" + id).find("span").css("color", toolsActiveColor);
    },
    /**
     * 取消选中工具栏菜单
     * @param  {[type]} id [description]
     * @return {[type]}    [description]
     */
    removeItemStyle: function (id) {
        var thisObject = earthToolsDiv.find("#" + id).find("img");
        if (thisObject.attr("isChecked")) {
            thisObject.removeAttr("isChecked");
            thisObject.attr("src", thisObject.attr("src").replace("active", "normal"));
            earthToolsDiv.find("#" + id).find("span").css("color", toolsNormalColor);
        }
    }
}
/*******************************工具栏对象Tools END*****************************************/