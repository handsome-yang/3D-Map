/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：视点管理js文件
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 **************************************************/
var viewpointDoc = null; //视点列表dom对象
var currIndex = null; //当前选择的数据索引
var earth;
window.onload = function () {
    //关闭视点管理
    $("#close_iframe").click(function () {
        top.ViewPointManagementBtn = false;
        top.setTableView(false, 135);
        top.resizeEarthTool();
        top.Tools.toolBarItemClickStyle("ViewPointManagement");
    });
    //上一页
    $("#leftButton").click(function () {
        prevClick();
    });
    //下一页
    $("#rightButton").click(function () {
        nextClick();
    });
    //添加视点
    $("#addView").click(function () {
        createViewPointClick();
    })
    //导入视点
    $("#import").click(function () {
        var fileXml2 = earth.UserDocument.LoadXmlFile(earth.RootPath + "viewpoint\\viewpoint.xml");
        var fileDoc2 = loadXMLStr(fileXml2);
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "vpt文件(*.vpt)|*.vpt");
        if (filePath == "") {
            return;
        }

        dataProcess.BaseFileProcess.FileUnPackage(filePath, earth.RootPath + "viewpoint");
        if (fileDoc2.documentElement.firstChild.childNodes.length > 0) {
            setTimeout(function () {
                var fileXml1 = earth.UserDocument.LoadXmlFile(earth.RootPath + "viewpoint\\viewpoint.xml");
                var fileDoc1 = loadXMLStr(fileXml1);
                if (fileXml1) {
                    var fileDoc1ChildLen = fileDoc1.documentElement.firstChild.childNodes.length;
                }
                var n = 0;  //新插入的视点数量
                var hasSameName = false;
                for (var i = 0; i < fileDoc1ChildLen; i++) {
                    var node1 = fileDoc1.documentElement.firstChild.childNodes[i - n];
                    var tag = true;
                    var bIsSameName = false;
                    for (var s = 0; s < fileDoc2.documentElement.firstChild.childNodes.length; s++) {
                        var node2 = fileDoc2.documentElement.firstChild.childNodes[s];
                        if (node2.getAttribute("name") === node1.getAttribute("name")) {
                            bIsSameName = true;
                            hasSameName = true;
                            break;
                        }
                        if (node1.getAttribute("id") === node2.getAttribute("id")) {
                            tag = false;
                            node2.setAttribute("name", node1.getAttribute("name"));
                            if (node1.getAttribute("Description")) {
                                desc = node1.getAttribute("Description");
                            } else {
                                desc = "";
                            }
                            node2.setAttribute("Description", desc);
                            node2.getElementsByTagName("Longitude")[0].text = node2.getElementsByTagName("Longitude")[0].text;
                            node2.getElementsByTagName("Latitude")[0].text = node2.getElementsByTagName("Latitude")[0].text;
                            node2.getElementsByTagName("Altitude")[0].text = node2.getElementsByTagName("Altitude")[0].text;
                            node2.getElementsByTagName("Heading")[0].text = node2.getElementsByTagName("Heading")[0].text;
                            node2.getElementsByTagName("Tilt")[0].text = node2.getElementsByTagName("Tilt")[0].text;
                            node2.getElementsByTagName("Roll")[0].text = node2.getElementsByTagName("Roll")[0].text;
                            node2.getElementsByTagName("Range")[0].text = node2.getElementsByTagName("Range")[0].text;
                        }
                    }
                    if (tag && !bIsSameName) {
                        insertAfter(node1, node2);
                        n = n + 1;
                    }
                }
                earth.UserDocument.SaveXmlFile(earth.RootPath + "viewpoint\\viewpoint", fileDoc2.xml);
                $("#sliderDiv").empty();
                $('<div id="slide_1" class="slideClass"></div>').appendTo($("#sliderDiv"));
                idNumber = 1;
                getStarted(earth);
                if (hasSameName) {
                    alert("导入成功，同名视点没有导入");
                } else {
                    alert("导入视点成功");
                }
            }, 100);
        } else {
            $("#sliderDiv").empty();
            $('<div id="slide_1" class="slideClass"></div>').appendTo($("#sliderDiv"));
            idNumber = 1;
            getStarted(earth);
            alert("导入视点成功");
        }
    });
    var dataProcess = document.getElementById("dataProcess");
    dataProcess.Load();
    //导出视点
    $("#export").click(function () {
        var filePath = earth.UserDocument.SaveFileDialog(earth.RootPath, "*.vpt", "vpt");
        if (filePath == "") {
            return;
        }
        dataProcess.BaseFileProcess.FilePackage(earth.RootPath + "viewpoint", filePath);
        alert("导出视点成功");
    });
}

//初始化
function getStarted(earthObj) {
    earth = earthObj;
    init();
    var len = $(".slideClass").length;
    for (var i = 1; i < len + 1; i++) {
        if (i != 1) {
            $("#slide_" + i).css("display", "none");
        } else {
            $("#slide_" + i).css("display", "block");
        }
    }
}
/**
 * 功能：获取xml文件的Doc对象
 * 参数：fileName-文件名(不包含后缀)
 * 返回值：xml文件的dom对象
 */
var getXmlFileDoc = function (fileName) {
    var loadPath = earth.Environment.RootPath + "viewpoint\\" + fileName + ".xml";
    var fileXml = earth.UserDocument.LoadXmlFile(loadPath);
    var fileDoc = loadXMLStr(fileXml);
    return fileDoc;
};

/**
 * 功能：保存xml文件的Doc字符串
 * 参数：fileName-文件名(不包含后缀)；fileDocXml-要保存的信息
 * 返回值：无
 */
var saveXmlFileDoc = function (fileName, fileDocXml) {
    var savePath = earth.Environment.RootPath + "viewpoint\\" + fileName;
    earth.UserDocument.SaveXmlFile(savePath, fileDocXml);
};


/**
 * 功能：删除xml文件
 * 参数：filePath-文件绝对路径
 * 返回值：无
 */
var deleteFile = function (filePath) {
    earth.UserDocument.DeleteXmlFile(filePath);
};
/**
 * 功能：删除一般文件
 * 参数：filePath-文件绝对路径
 * 返回值：无
 */
var deleteFile_img = function (filePath) {
    earth.UserDocument.DeleteFile(filePath);
};

/**
 * 功能：创建视点列表文件
 * 参数：fileName-文件名(不包含后缀)
 * 返回值：无
 */
var createViewpointFile = function (fileName) {
    var id = earth.Factory.CreateGuid();
    var xmlStr = '<xml><ViewpointList id="' + id + '" name="viewpoints"/></xml>';
    saveXmlFileDoc(fileName, xmlStr);
    return xmlStr;
};

/**
 * 功能：获取视点列表文件的dom对象
 * 参数：fileName-文件名(不包含后缀)
 * 返回值：xml文件的dom对象
 */
var getViewpointDoc = function (fileName) {
    var xmlDoc = getXmlFileDoc(fileName);
    if ((xmlDoc === null) || (xmlDoc.xml === "")) {
        var xmlStr = createViewpointFile(fileName);
        xmlDoc = loadXMLStr(xmlStr);
    }
    return xmlDoc;
};

/**
 * 功能：视点列表行单击事件
 * 参数：rowIndex-单击的行索引号；rowData-单击的行数据
 * 返回值：无
 */
var tonClickRow = function (rowIndex, rowData) {

    currIndex = rowIndex;
};

/**
 * 功能：视点列表行双击事件
 * 参数：rowIndex-双击的行索引号；rowData-双击的行数据
 * 返回值：无
 */
var tonDblClickRow = function (rowIndex, rowData) {
    rowIndex = parseInt(rowIndex);
    currIndex = rowIndex;
    var rowNode = viewpointDoc.documentElement.firstChild.childNodes[rowIndex];
    var lon = rowNode.selectSingleNode("Longitude").text;
    var lat = rowNode.selectSingleNode("Latitude").text;
    var alt = rowNode.selectSingleNode("Altitude").text;
    var heading = rowNode.selectSingleNode("Heading").text;
    var tilt = rowNode.selectSingleNode("Tilt").text;
    var roll = rowNode.selectSingleNode("Roll").text;
    var range = rowNode.selectSingleNode("Range").text;
    earth.GlobeObserver.FlytoLookat(lon, lat, alt, heading, tilt, roll, range, 3);
};
/**
 * 功能：增加视点管理节点
 * 参数：被增加的div
 * 返回值：无
 */
var appendAddNode = function (tagId) {
    var htmlStr = '<div style="float:left;word-break:break-all;width:20%;height:112px;overflow:hidden;outline:none;border:0;">';
    htmlStr += '<a href="javascript:void(0);"><img id="createImg" src="../../images/ViewPoint/Add.png"  width="90%" height="112px" alt="新建视点" onclick="createViewPointClick()"/></a>'
    htmlStr += '</div>';
    $("#" + tagId).append(htmlStr);
};

/**
 * 功能：隐藏子菜单
 * 参数：无
 * 返回值：无
 */
var hiddenRightMenu = function () {
    $("#rigMouMenuDiv").css({"display": "none"});
};

/**
 * 功能：初始化页面
 * 参数：无
 * 返回值：无
 */
var init = function () {
    viewpointDoc = getViewpointDoc("viewpoint");
    initViewpointImgList();
};

/**
 * 功能：根据节点数据源，添加一个视点缩略图
 * 参数：index-视点索引; node-数据源节点
 * 返回值：无
 */
var lengthArr = [];
var getWebView = function () {
    var path = top.params.ip + "/viewImages/";
    return path;
}
var appendImgByNode = function (index, node, tagId) {
    var id = node.getAttribute("id");
    var name = node.getAttribute("name");
    var desp = node.selectSingleNode("Description").text;
    var imgPath = earth.Environment.RootPath + "viewpoint\\" + id + ".jpg";
    var width_img = $("#sliderDiv").width() / 5;
    var ieversion = IeVesion();
    var divstr;
    if (ieversion < 10) {
        divstr = '<div title=\"' + desp + '\" style="cursor:pointer; FILTER: progid:DXImageTransform.Microsoft.AlphaImageLoader(src=' + imgPath + ', sizingMethod=scale); WIDTH: 90%; HEIGHT: 112px" ';
    }
    else {
        divstr = '<div title=\"' + desp + '\" style="cursor:pointer;width:90%;height:112px;"'
    }
    var htmlStr = "";
    htmlStr = htmlStr + '<div  style="float:left;word-break:break-all;position:relative;WIDTH: 20%;height:120px;overflow:hidden" id=\"viewpoint' + index + '\">';
    htmlStr = htmlStr + '<div style=\"height:20px; width:50px; margin:0; border:0; position: absolute;right:25px;top: 5px;z-index:100\">'
    htmlStr = htmlStr + '<img src=\"../../images/ViewPoint/edit.png\" style=\"margin-right:5px;cursor:pointer;\"  title=\"编辑视点\" onclick=\"editViewpointClick(' + index + ');\"/>';
    htmlStr = htmlStr + '<img src=\"../../images/ViewPoint/delete.png\" style=\"cursor:pointer;\"  title=\"删除视点\" onclick=\"deleteViewpointClick(' + index + ');\"/></div>'
    htmlStr = htmlStr + divstr;
    htmlStr = htmlStr + ' id="img' + index + '" ';
    htmlStr = htmlStr + ' onmouseover="this.className=\'divBorder\'" ';
    htmlStr = htmlStr + ' onmouseout="this.className=\'divNonBorder\'" ';
    htmlStr = htmlStr + ' ondblclick="tonDblClickRow(' + index + ', null)" ';
    htmlStr = htmlStr + ' onclick="tonClickRow(1, null)" >';
    if (ieversion > 9 || !ieversion) {//ie版本大于9不支持滤镜，则从服务器取，如果服务器没有则给一张默认的图片
        var path = getWebView();
        htmlStr += '<img src="' + path + id + '.jpg" onerror="this.src=\'../../images/ViewPoint/default.jpg\'" style="width:100%;height:100%;" />'
    }

    htmlStr = htmlStr + '</div>';
    htmlStr = htmlStr + '<div class="viewpointName" style="height:30px; width:90%; background-color:#2E2E2E; filter: alpha(opacity=60); opacity:0.6; text-align:center;position:absolute;bottom:0;left:0;font-size:14px;font-family:Microsoft Yahei;color:#fff;">'
    htmlStr = htmlStr + name;
    htmlStr = htmlStr + '</div>';
    htmlStr = htmlStr + '</div>';
    $("#" + tagId).append(htmlStr);
};

//插入节点到目标节点后面
function insertAfter(newElement, targetElement) {
    var p = targetElement.parentNode;
    if (p.lastChild == targetElement) {
        p.appendChild(newElement);
    } else {
        p.insertBefore(newElement, targetElement.nextSibling);
    }
}


//js判断各浏览器类型以及IE版本
var IeVesion = function () {
    var Sys = {};
    var ua = window.navigator.userAgent.toLowerCase();
    var s;
    (s = ua.match(/msie ([\d.]+)/)) ? Sys.ie = s[1] : 0;
    var ieversion;
    if (Sys.ie) {
        ieversion = parseInt(Sys.ie);
    }
    return ieversion;
};

/**
 * 功能：根据节点数据源，更新一个视点缩略图
 * 参数：index-视点索引; node-数据源节点
 * 返回值：无
 */
var updateImgByNode = function (index, node) {
    var name = node.getAttribute("name");
    var desp = node.selectSingleNode("Description").text;
    var divId = "img" + index;
    var imgObj = document.getElementById(divId);
    imgObj.nextSibling.innerHTML = name;
    imgObj.title = desp;
};

var tag_id = "";//第几页的div的id
var idNumber = 1;//目前是在第几页

/**
 * 功能：初始化缩略图视图
 * 参数：无
 * 返回值：无
 */
var initViewpointImgList = function () {
    var rootNode = viewpointDoc.documentElement.firstChild;
    var count = rootNode.childNodes.length;
    var pages = Math.ceil(count / 5);

    for (var i = 0; i < count; i++) {
        if (i == 0) {
            tag_id = "slide_" + idNumber;
        }
        if (i % 5 == 0 && i != 0) {
            idNumber++;
            tag_id = "slide_" + idNumber;
            var slide = '<div id="slide_' + idNumber + '" ></div>';
            $('<div id="slide_' + idNumber + '" class="slideClass"></div>').appendTo($("#sliderDiv"));
        }
        var childNode = rootNode.childNodes[i];
        appendImgByNode(i, childNode, tag_id);
    }
    if (count < 6) {
        $(".arrowButton").hide();
    } else {
        $(".arrowButton").show();
    }
};

/**
 * 功能：创建视点节点
 * 参数：dataObj-视点创建参数
 * 返回值：视点节点
 */
var createElementViewpoint = function (dataObj, viewpointDoc) {
    var id = earth.Factory.CreateGuid();
    var name = dataObj.pointName;
    var desp = dataObj.description;
    var currPose = earth.GlobeObserver.Pose;
    var targetPose = earth.GlobeObserver.TargetPose;
    var lon = targetPose.Longitude;
    var lat = targetPose.Latitude;
    var alt = targetPose.Altitude;
    var heading = currPose.Heading;
    var tilt = currPose.Tilt;
    var roll = currPose.Roll;
    var range = currPose.Range;

    var attrArr = [
        {name: "id", value: id},
        {name: "name", value: name}
    ];
    var viewpointNode = createElementNode("Viewpoint", attrArr, viewpointDoc);
    viewpointNode.appendChild(new createElementText("Longitude", lon, viewpointDoc));
    viewpointNode.appendChild(new createElementText("Latitude", lat, viewpointDoc));
    viewpointNode.appendChild(new createElementText("Altitude", alt, viewpointDoc));
    viewpointNode.appendChild(new createElementText("Heading", heading, viewpointDoc));
    viewpointNode.appendChild(new createElementText("Tilt", tilt, viewpointDoc));
    viewpointNode.appendChild(new createElementText("Roll", roll, viewpointDoc));
    viewpointNode.appendChild(new createElementText("Range", range, viewpointDoc));
    viewpointNode.appendChild(new createElementText("Description", desp, viewpointDoc));
    return viewpointNode;
};

/**
 * 功能：创建视点节点
 * 参数：viewpointNode-要修改的节点；dataObj-视点修改参数
 * 返回值：无
 */
var editElementViewpoint = function (viewpointNode, dataObj) {
    var name = dataObj.pointName;
    var desp = dataObj.description;
    viewpointNode.setAttribute("name", name);
    viewpointNode.selectSingleNode("Description").text = desp;
};
/**
 *功能：获取视点图片存放位置
 */
var getViewImageDir = function () {
    var dir = top.params.ip.replace(/^http:\/{2}/g, '\\\\');
    dir += "\\home\\stamp\\http\\viewImages\\";
    earth.UserDocument.CreateDirectory(dir);
    return dir;

};
/**
 * 功能：创建视点
 * 参数：无
 * 返回值：无
 */
var createViewPointClick = function () {
    var params = {
        titleText: "新建视点",
        earth: earth
    };

    var href = window.location.href;
    var array = href.split("/");
    var currentName = array[array.length - 1];
    var src = href.replace(currentName, "viewpointManagementDialog.html");

    var data = openDialog(src, params, 280, 169);
    if (data == null) {
        return;
    }
    var checkedNode = lookupNodeByName(viewpointDoc, data.pointName);
    if (checkedNode != null) {
        alert("已经存在同名视点，请重新命名");
        return;
    }
    var viewpointNode = createElementViewpoint(data, viewpointDoc);
    viewpointDoc.documentElement.firstChild.appendChild(viewpointNode);
    saveXmlFileDoc("viewpoint", viewpointDoc.xml);

    var id = viewpointNode.getAttribute("id");
    var path = earth.Environment.RootPath + "viewpoint\\" + id + ".jpg";
    var dir = getViewImageDir();
    var fileName = id + ".jpg";
    var savePath = dir + fileName;
    earth.ScreenShot(savePath, 1);//保存到服务器
    earth.ScreenShot(path, 1);//保存到客户端
    $("#sliderDiv").empty();
    $('<div id="slide_1" class="slideClass"></div>').appendTo($("#sliderDiv"));
    idNumber = 1;
    tag_id = "";
    getStarted(earth);
    var len = $(".slideClass").length;
    for (var i = 1; i < len + 1; i++) {
        if (i != len) {
            $("#slide_" + i).css("display", "none");
        } else {
            $("#slide_" + i).css("display", "block");
        }
    }
};

/**
 * 功能：编辑视点
 * 参数：无
 * 返回值：无
 */
var editViewpointClick = function (currIndex) {
    hiddenRightMenu();//currIndex
    var rootNode = viewpointDoc.documentElement.firstChild;
    var editViewpointNode = rootNode.childNodes[currIndex];
    var params = {
        titleText: "编辑视点",
        data: editViewpointNode
    };
    var data = openDialog("viewpointManagementDialog.html", params, 280, 169);
    if (data == null) {
        return;
    }
    for (var i = 0; i < rootNode.childNodes.length; i++) {
        if (i != currIndex && data.pointName === rootNode.childNodes[i].getAttribute("name")) {
            alert("已经存在同名视点，请重新命名");
            return;
        }
    }

    editElementViewpoint(editViewpointNode, data);
    saveXmlFileDoc("viewpoint", viewpointDoc.xml);

    updateImgByNode(currIndex, editViewpointNode);
};

/**
 * 功能：删除视点
 * 参数：无
 * 返回值：无
 */
var deleteViewpointClick = function (index) {

    var flag = confirm("确实要删除吗？");
    if (flag == false) {
        return;
    }

    var len = $(".slideClass").length;
    for (var k = 1; k < len + 1; k++) {
        if ($("#slide_" + k).css("display") == "block") {
            break;
        }
    }

    var rootNode = viewpointDoc.documentElement.firstChild;
    var deletedNode = rootNode.childNodes[index];
    deletedNode.parentNode.removeChild(deletedNode);
    saveXmlFileDoc("viewpoint", viewpointDoc.xml);

    var id = deletedNode.getAttribute("id");
    var deletePath = earth.Environment.RootPath + "viewpoint\\" + id + ".jpg";
    var deleteDir = getViewImageDir();
    var deleteWebPath = deleteDir + "\\" + id + ".jpg";
    deleteFile_img(deletePath);
    deleteFile_img(deleteWebPath);
    $("#sliderDiv").empty();
    $('<div id="slide_1" class="slideClass"></div>').appendTo($("#sliderDiv"));
    idNumber = 1;
    tag_id = '';
    getStarted(earth);
    len = $(".slideClass").length;
    if (k > len) {
        k = len;
    }
    for (var i = 1; i < len + 1; i++) {
        if (i != k) {
            $("#slide_" + i).css("display", "none");
        } else {
            $("#slide_" + i).css("display", "block");
        }
    }

};
/**
 * 上一页点击事件
 */
function prevClick() {
    var len = $(".slideClass").length;
    for (var i = 1; i < len + 1; i++) {
        if ($("#slide_" + i).css("display") == "block") {
            if (i == 1) {
                return;
            } else {
                var index = i - 1;
                $("#slide_" + i).css("display", "none");
                $("#slide_" + index).css("display", "block");
            }
            break;
        }
    }
}
/**
 * 下一页点击事件
 */
function nextClick() {
    var len = $(".slideClass").length;
    for (var i = 1; i < len + 1; i++) {
        if ($("#slide_" + i).css("display") == "block") {
            if (i == len) {
                return;
            } else {
                var index = i + 1;
                $("#slide_" + i).css("display", "none");
                $("#slide_" + index).css("display", "block");
            }
            break;
        }
    }
}
