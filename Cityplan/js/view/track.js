/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月26日
 * 描    述：飞行路径页面脚步
 * 注意事项：依赖jquery.js
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var TrackMap = {}; //每个track对象的飞行对象映射
var cTrackType = 3; //记录当前TrackType

/**
 * 设置页面内各div高度
 */
function setDivHeight() {
    var outerHeight = top.STAMP_config.height.bannerHeight + top.STAMP_config.height.toolHeight;
    var minusHeight = outerHeight + $(".cardTitle").height() + $("#southDiv").height() + $("#northDiv").height();
    var divHeight = $(parent.document).height() - minusHeight;
    $("#dgDiv").height(divHeight);
    $("#resultDiv").height(divHeight - $("#tabhead").height());
    $("#resultDiv").mCustomScrollbar({});
}

//左侧面板调整窗口高度自适应
$(window).resize(function() {
    try {
        setDivHeight();
    } catch (e) {
        console.log(e);
    }
});

$(function() {
    var divHeight = $("#tableDiv").height() - $(".cardTitle").height();
    $("#dgDiv").height(divHeight);
    $("#dgDiv").mCustomScrollbar();

    var earth = top.LayerManagement.earth;
    var trackManager = STAMP.TrackManager(earth);
    var treeTrack = null; // 漫游路径树
    var treeTrackStation = null; // 漫游路径节点树
    var numFlying = 0; // 当前正在飞行的漫游路线
    var curEditingTrack = null; // 当前正在被编辑的漫游路径
    var action = " "; //动作标识-路径、观察点、环绕点
    var bNew = true; // 是新建路径(true)还是编辑路径(false)
    var displayTag = "false"; //显示标识
    var isvideo = false; //正在录制视频
    var videoTag = false; //录制视频
    var total_frame_count = 0; //总的视频录制帧数
    var current_frame_count = 0; //当前录制得第几帧
    var recordState = false; //录制状态：true未录制或暂停状态；false正在录制
    var flyNodes = []; //飞行中的路径数组
    var flyCount = 0; //飞行中的路径数量
    var bAppendPass = false; //添加路径是否是追加
    var dataProcess = document.getElementById("dataProcess");
    dataProcess.Load();

    // 树基本设置
    var setting = {
        data: {
            simpleData: {
                enable: true
            }
        },
        view: {
            dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
            expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
            selectedMulti: false, //设置是否允许同时选中多个节点
            showTitle: false
        },
        edit: {
            enable: true,
            drag: {
                prev: true,
                inner: false,
                next: true
            },
            showRemoveBtn: false,
            showRenameBtn: false
        },
        callback: {}
    };

    /**
     * 插入节点到目标节点后面
     * @param  {[type]} newElement    [description]
     * @param  {[type]} targetElement [description]
     * @return {[type]}               [description]
     */
    function insertAfter1(newElement, targetElement) {
        var parent = targetElement.parentNode;
        if (parent.lastChild == targetElement) {
            parent.appendChild(newElement);
        } else {
            parent.insertBefore(newElement, targetElement.nextSibling);
        }
    };

    /**
     * 修改按钮的css样式（新建、飞行点、环绕点、观察点）
     * @param  {[type]} obj      [description]
     * @param  {[type]} nowClass [description]
     * @param  {[type]} oldClass [description]
     * @return {[type]}          [description]
     */
    function changeCss(obj, nowClass, oldClass) {
        var disIndex = nowClass.indexOf("Dis");
        if (disIndex > 0) {
            $(obj).attr("disabled", true);
        } else {
            $(obj).attr("disabled", false);
        }
        $(obj).removeClass(oldClass);
        $(obj).addClass(nowClass);
    }


    /**
     * 拖拽结束后的事件回调
     * @param  {[type]} event      [description]
     * @param  {[type]} treeId     [description]
     * @param  {[type]} treeNodes  [description]
     * @param  {[type]} targetNode [description]
     * @param  {[type]} moveType   [description]
     * @return {[type]}            [description]
     */
    function zTreeOnDrop(event, treeId, treeNodes, targetNode, moveType) {
        //先处理xml节点保存
        if (targetNode) {
            var treeObj = $.fn.zTree.getZTreeObj("trackTree");
            var parentNode = treeNodes[0].getParentNode();
            if (targetNode.level === 1) { //level == 1 表示漫游路径节点 track节点操作
                trackManager.sortTrack(treeNodes[0].id, targetNode.id, moveType);
            } else {
                //路径xml操作
                var trackID;
                var dragGuid = treeNodes[0].id;
                if (targetNode.level === 2) { //路径节点下级别
                    trackID = parentNode.id;
                } else if (targetNode.level === 3) { //pass内节点级别
                    trackID = parentNode.getParentNode().id;
                }

                //保存到本地xml
                var dragLevel = targetNode.level;
                trackManager.sortStation(trackID, dragGuid, targetNode.id, moveType, dragLevel);

                //同步到场景中
                var track = earth.TrackControl.GetTrack(trackID);
                if (moveType === "prev") {
                    track.SortStation(dragGuid, targetNode.id);
                    track.CommitChanges();
                } else if (moveType === "next") {
                    //注意:这里要转换两次
                    track.SortStation(dragGuid, targetNode.id);
                    track.SortStation(targetNode.id, dragGuid);
                    track.CommitChanges();
                };
            }
        }
    };

    /**
     * 文件夹允许拖拽
     * @param  {[type]} treeId    [description]
     * @param  {[type]} treeNodes [description]
     * @return {[type]}           [description]
     */
    function zTreeBeforeDrag(treeId, treeNodes) {
        return true;
    };

    /**
     * 拖拽释放时触发 如果目标对象是父节点或者跨级 则拖拽设置为无效
     * @param  {[type]} treeId     [description]
     * @param  {[type]} treeNodes  [description]
     * @param  {[type]} targetNode [description]
     * @param  {[type]} moveType   [description]
     * @return {[type]}            [description]
     */
    function zTreeBeforeDrop(treeId, treeNodes, targetNode, moveType) {
        //不允许同一个路径下不同route下的station平跨拖拽
        if (targetNode.getParentNode().id != treeNodes[0].getParentNode().id) {
            return false;
        }
        //处理一个路径下的不同pass文件夹里的不同子节点之间的拖拽
        if (treeNodes[0].isParent === false && targetNode.isParent === false && treeNodes[0].level === 3 && targetNode.level === 3 && treeNodes[0].getParentNode().getParentNode().id === targetNode.getParentNode().getParentNode().id) {
            return true;
        }
        //拖拽对象的父对象
        if (treeNodes[0].getParentNode().id != targetNode.getParentNode().id) {
            return false;
        }
        return true;
    };

    /**
     * 新建按钮激活状态
     * @return {[type]} [description]
     */
    var enableNew = function() {
        if (numFlying == 0) {
            $("#btnNew").removeAttr("disabled");
            changeCss("#btnNew", "btnNew", "btnNewDis");
        } else {
            $("#btnNew").attr("disabled", "disabled");
            changeCss("#btnNew", "btnNewDis", "btnNew");
        }
    };

    /**
     * 飞行中路径数减1，最小为0
     * @return {[type]} [description]
     */
    var decreaseNumFlying = function() {
        numFlying -= 1;
        if (numFlying < 0) {
            numFlying = 0;
        }
    };

    /**
     * 漫游路径树鼠标事件
     * @param  {[type]}  node    [description]
     * @param  {Boolean} isRight [description]
     * @return {[type]}          [description]
     */
    var onSelectTrackNode = function(node, isRight) {
        if (!node) return;
        if (node.id != -1 && node.pId == -1) { // 漫游路径对象节点
            var track = earth.TrackControl.GetTrack(node.id);
            var trackType = $("#"+node.tId+"_span").data("trackType");

            if (track) {
                if (!isRight) {
                    $("#divShowRoute,#btnStart,#divChcekControl,#video").removeAttr("disabled");
                }
                $("#divRoleTrack :radio").removeAttr("checked");
                $("#divRoleTrack :radio[value=" + track.TrackType + "]").attr("checked", "checked");

                if (track.Status == 0) { // stop
                    $("#selFlyObj").removeAttr("disabled");
                    enableNew();
                    $("#btnStop").attr("disabled", "disabled");
                    $("#divRoleTrack :radio,#divRealTimeControl,#divShowActor").attr("disabled", "disabled");
                    $("#btnStart").text("飞行");
                    $("#selFlyObj").val($("#selFlyObj option:first-child").val());
                    $("#divRoleTrack :radio").removeAttr("checked");
                    $("#divRoleTrack :radio[value=3]").attr("checked", "checked");
                } else if (track.Status == 1) { // play
                    $("#selFlyObj").attr("disabled", "disabled");
                    enableNew();
                    $("#btnStop").removeAttr("disabled");
                    $("#divRoleTrack :radio,#divRealTimeControl,#chkRealTimeControl,#divShowActor").removeAttr("disabled");
                    $("#btnStart").text("暂停");
                    $("#selFlyObj").val(TrackMap[track.guid]);
                    earth.TrackControl.SetMainTrack(node.id, trackType);
                } else if (track.Status == 2) { // pause
                    $("#selFlyObj").attr("disabled", "disabled");
                    enableNew();
                    $("#btnStop").removeAttr("disabled");
                    $("#divRoleTrack :radio,#divRealTimeControl,#divShowActor").attr("disabled", "disabled");
                    $("#btnStart").text("继续");
                    $("#selFlyObj").val(TrackMap[track.guid]);
                    earth.TrackControl.SetMainTrack(node.id, trackType);
                }

                if (track.Visibility) {
                    $("#chkShowRoute").attr("checked", "checked");
                } else {
                    $("#chkShowRoute").removeAttr("checked");
                }

                if ($("#chkRealTimeControl").attr("checked") == "checked") {
                    var stationCount = track.GetChildCount();
                    for (var i = 0; i < stationCount; i++) {
                        var station = track.GetChildAt(i);
                        if (station.Rtti == 504) {
                            var passCount = station.GetChildCount();
                            station.RealtimeMode = true;
                        }
                    }
                }

                if (node.showActor == true) {
                    $("#chkShowActor").attr("checked", "checked");
                } else {
                    $("#chkShowActor").removeAttr("checked");
                }
            }
        } else {
            $("#btnStart,#btnStop,#divRoleTrack :radio,#divChcekControl,#video,#divRealTimeControl").attr("disabled", "disabled");
        }

    }

    /**
     * 树节点单击
     * @param  {[type]} event  [description]
     * @param  {[type]} treeId [description]
     * @param  {[type]} node   [description]
     * @return {[type]}        [description]
     */
    var clickTrackNode = function(event, treeId, node) {
        //读取被该节点是否有记录，有就取值，没有就用默认值
        cTrackType=$("#"+node.tId+"_span").data("trackType")?$("#"+node.tId+"_span").data("trackType"):3;
        if (node == null) return;
        onSelectTrackNode(node);
        if (node.isParent && node.pId == -1 && node.id != -1) {
            curEditingTrack = earth.TrackControl.GetTrack(node.id);
            if (videoTag) {
                $("#btnStart").attr("disabled", "disabled");
                $("#btnStop").attr("disabled", false);
            }
            $("#btnStationPass").removeAttr("disabled");
            $("#btnStationLookat").removeAttr("disabled");
            $("#btnStationSurround").removeAttr("disabled");
            changeCss("#btnStationPass", "pass", "passDis");
            changeCss("#btnStationLookat", "lookat", "lookatDis");
            changeCss("#btnStationSurround", "surround", "surroundDis");
        } else if (node.id != -1 && node.pId != -1 && node.isParent) {
            var parentNode = node.getParentNode();
            if (parentNode.pId == -1) {
                curEditingTrack = earth.TrackControl.GetTrack(parentNode.id);
            }
            //处理radio状态
            $("#divRoleTrack :radio").removeAttr("checked");
            $("#divRoleTrack :radio[value=3]").attr("checked", "checked");
            $("#btnStationPass").removeAttr("disabled");
            $("#btnStationLookat").attr("disabled", "disabled");
            $("#btnStationSurround").attr("disabled", "disabled");
            changeCss("#btnStationPass", "pass", "passDis");
            changeCss("#btnStationLookat", "lookatDis", "lookat");
            changeCss("#btnStationSurround", "surroundDis", "surround");
        } else if (node.id == -1 && node.pId != -1) {
            curEditingTrack = "";
            $("#btnStationPass").attr("disabled", "disabled");
            $("#btnStationLookat").attr("disabled", "disabled");
            $("#btnStationSurround").attr("disabled", "disabled");
            changeCss("#btnStationPass", "passDis", "pass");
            changeCss("#btnStationLookat", "lookatDis", "lookat");
            changeCss("#btnStationSurround", "surroundDis", "surround");
        } else {
            var parentNode = node.getParentNode().getParentNode();
            if (parentNode) {
                curEditingTrack = earth.TrackControl.GetTrack(parentNode.id);
            }
            $("#btnStationPass").attr("disabled", "disabled");
            $("#btnStationLookat").attr("disabled", "disabled");
            $("#btnStationSurround").attr("disabled", "disabled");
            changeCss("#btnStationPass", "passDis", "pass");
            changeCss("#btnStationLookat", "lookatDis", "lookat");
            changeCss("#btnStationSurround", "surroundDis", "surround");
        }

        //树节点点击时，让人称方式一直保持不变
        if (cTrackType == 1) {
            $("#divRoleTrack :radio").removeAttr("checked");
            $("#divRoleTrack :radio[value=1]").attr("checked", "checked");
        } else if (cTrackType == 3) {
            $("#divRoleTrack :radio").removeAttr("checked");
            $("#divRoleTrack :radio[value=3]").attr("checked", "checked");
        } else if (cTrackType == 4) {
            $("#divRoleTrack :radio").removeAttr("checked");
            $("#divRoleTrack :radio[value=4]").attr("checked", "checked");
        }
        if (node.level === 1) {
            if (node.children === null || node.children === undefined) {
                $("#btnStart").attr("disabled", "disabled");
                $("#video").attr("disabled", "disabled");
                $("#divShowRoute").attr("disabled", "disabled");
            }
            if (node.children && node.children.length === 0) {
                $("#btnStart").attr("disabled", "disabled");
                $("#video").attr("disabled", "disabled");
                $("#divShowRoute").attr("disabled", "disabled");
            }
        }
        //飞行状态下按钮状态控制
        var tracks = trackManager.getTracks();
        if (tracks.length != 0) {
            for (var s = 0; s < tracks.length; s++) {
                var track = earth.TrackControl.GetTrack(tracks[s].ID);
                if (track.Status === 1 || track.Status === 2) {
                    $("#video").attr("disabled", "dsabled");
                    $("#btnNew").attr("disabled", "disabled");
                    $("#btnStationPass").attr("disabled", "disabled");
                    $("#btnStationLookat").attr("disabled", "disabled");
                    $("#btnStationSurround").attr("disabled", "disabled");
                    changeCss("#btnNew", "btnNewDis", "btnNew");
                    changeCss("#btnStationPass", "passDis", "pass");
                    changeCss("#btnStationLookat", "lookatDis", "lookat");
                    changeCss("#btnStationSurround", "surroundDis", "surround");
                }
                if (isvideo === true) {
                    $("#btnStart").attr("disabled", "dsabled");
                    $("#btnNew").attr("disabled", "disabled");
                    $("#btnStationPass").attr("disabled", "disabled");
                    $("#btnStationLookat").attr("disabled", "disabled");
                    $("#btnStationSurround").attr("disabled", "disabled");
                    changeCss("#btnNew", "btnNewDis", "btnNew");
                    changeCss("#btnStationPass", "passDis", "pass");
                    changeCss("#btnStationLookat", "lookatDis", "lookat");
                    changeCss("#btnStationSurround", "surroundDis", "surround");
                }
            }
        }
    };

    /**
     * 双击漫游路径定位到第一个节点
     * @param  {[type]} event  [description]
     * @param  {[type]} treeId [description]
     * @param  {[type]} node   [description]
     * @return {[type]}        [description]
     */
    var dblClickTrackNode = function(event, treeId, node) {
        var track = null;
        if (node) {
            if (node.isParent) {
                treeTrack.expandNode(node);
                track = earth.TrackControl.GetTrack(node.id);
                trackManager.locateToTrack(track);
            } else {
                var station;
                var parentNode = node.getParentNode().getParentNode();
                if (parentNode.pId == -1) {
                    track = earth.TrackControl.GetTrack(parentNode.id);
                    station = track.GetStationByGuid(node.id);
                    trackManager.locateToStation(station);
                }
                if (node.getParentNode().pId == -1) {
                    track = earth.TrackControl.GetTrack(node.getParentNode().id);
                    station = track.GetStationByGuid(node.id);
                    trackManager.locateToStation(station);
                }
            }
        }
    };

    /**
     * 树节点展开
     * @param  {[type]} event  [description]
     * @param  {[type]} treeId [description]
     * @param  {[type]} node   [description]
     * @return {[type]}        [description]
     */
    var zTreeOnExpand = function(event, treeId, node) {
        if (node.isParent && node.pId == -1 && node.id != -1) {
            var track = earth.TrackControl.GetTrack(node.id);
            if (track.Status === 1) {
                node.icon = "../../images/track/loading.gif";
            }
        }
        treeTrack.updateNode(node);
    }

    /**
     * 树节点收缩
     * @param  {[type]} event  [description]
     * @param  {[type]} treeId [description]
     * @param  {[type]} node   [description]
     * @return {[type]}        [description]
     */
    var zTreeOnCollapse = function(event, treeId, node) {
        if (node.isParent && node.pId == -1 && node.id != -1) {
            var track = earth.TrackControl.GetTrack(node.id);
            if (track.Status === 1) {
                node.icon = "../../images/track/loading.gif";
            }
        }
        treeTrack.updateNode(node);
    }

    /**
     * 右键选中节点，并弹出右键菜单
     * @param  {[type]} event  [description]
     * @param  {[type]} treeId [description]
     * @param  {[type]} node   [description]
     * @return {[type]}        [description]
     */
    var rightClickTrackNode = function(event, treeId, node) {
        $.fn.zTree.getZTreeObj(treeId).selectNode(node);
        clickTrackNode(event, treeId, node);
        if (node) {
            if (numFlying == 0) {
                if (node.id != -1 && node.pId == -1) { // 漫游路径对象节点
                    treeTrack.selectNode(node);
                    onSelectTrackNode(node, true);
                    $('#contextMenuTrack').menu('show', { //track
                        left: event.pageX,
                        top: event.pageY
                    });
                } else if (node.id == -1 && node.pId != -1) { //根节点 g
                    $('#rootMenu').menu('show', {
                        left: event.pageX,
                        top: event.pageY
                    });
                } else if (node.id != -1 && node.pId != -1 && node.isParent) { // pass屏蔽pass右键p
                    divDeleteStation.style.display = "";
                    $('#contextMenuStation').menu('show', {
                        left: event.pageX,
                        top: event.pageY
                    });
                    var parentNode = node.getParentNode();
                    if (parentNode.pId == -1) {
                        curEditingTrack = earth.TrackControl.GetTrack(parentNode.id);
                    }
                } else if (node.id != -1 && node.pId != -1 && node.getParentNode().pId == -1 && !node.isParent) {
                    $('#contextMenuStation').menu('show', {
                        left: event.pageX,
                        top: event.pageY
                    });
                    var parentNode = node.getParentNode();
                    if (parentNode.pId == -1) {
                        curEditingTrack = earth.TrackControl.GetTrack(parentNode.id);
                    }
                } else {
                    var passNode = node.getParentNode(); //子节点
                    //这里判断有问题!!! 对于观察点与环绕点 应该也出现删除选项... todo
                    if (passNode && passNode.pId != -1 && passNode.children.length <= 3) {
                        divDeleteStation.style.display = "none";
                        sep.style.display = "none";
                        displayTag = "true";
                    } else if (displayTag === "true") {
                        divDeleteStation.style.display = "";
                        sep.style.display = "";
                        displayTag = "false";
                    }

                    $('#contextMenuStation').menu('show', {
                        left: event.pageX,
                        top: event.pageY
                    });

                    if (node.level === 2) {
                        divDeleteStation.style.display = "";
                    }

                    var parentNode = node.getParentNode().getParentNode();
                    if (parentNode.pId == -1) {
                        curEditingTrack = earth.TrackControl.GetTrack(parentNode.id);
                    }
                }
            }
        }
    };
    // endregion

    /**
     * 能否删除
     * @param  {[type]} node [description]
     * @return {[type]}      [description]
     */
    var canDelete = function(node) {
        var station = curEditingTrack.GetStationByGuid(node.id);
        var route = null;
        if (station.Rtti == 501) { // pass
            route = curEditingTrack.GetStationByGuid(node.id);
            return route.GetChildCount() > 3;
        }
        return true;
    };
    // endregion

    /**
     * 初始化路径树
     * @return {[type]} [description]
     */
    var initTrackTree = function() {
        var tracks = trackManager.getTracks();
        var trackTreeData = [{
            id: -1,
            name: '漫游路径',
            open: true,
            isParent: true,
            icon: "../../images/treeIcons/folder.png"
        }];

        setting.callback = {
            onClick: clickTrackNode,
            onDblClick: dblClickTrackNode,
            onRightClick: rightClickTrackNode,
            onExpand: zTreeOnExpand,
            onCollapse: zTreeOnCollapse,
            beforeDrop: zTreeBeforeDrop,
            beforeDrag: zTreeBeforeDrag,
            onDrop: zTreeOnDrop
        };

        //保持父节点属性
        setting.data.keep = {
            parent: true
        };

        $.each(tracks, function(i, track) {
            trackTreeData.push({
                id: track["ID"],
                pId: -1,
                name: track["NAME"],
                showActor: false, // 自定义属性：是否显示人
                isParent: true,
                icon: "../../images/treeIcons/folder.png"
            });
            trackManager.createTrack(track["ID"], track["NAME"], false);
            var curTrack = earth.TrackControl.GetTrack(track["ID"]);
            var stations = trackManager.getStations(curTrack);
            if (stations) {
                $.each(stations, function(k, station) {
                    trackTreeData.push(station);
                });
            }

        });
        treeTrack = $.fn.zTree.init($("#trackTree"), setting, trackTreeData)
    };

    //导出路径
    $("#exportImg").click(function() {
        var filePath = earth.UserDocument.SaveFileDialog(earth.RootPath, "*.rad", "rad");
        if (filePath == "") {
            return;
        }
        dataProcess.BaseFileProcess.FilePackage(earth.RootPath + "track", filePath);
        alert("路径导出成功！");
    });

    //导入路径
    $("#importImg").click(function() {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "rad文件(*.rad)|*.rad");
        if (filePath == "") {
            return;
        }
        dataProcess.BaseFileProcess.FileUnPackage(filePath, earth.RootPath);
        var tracks = earth.UserDocument.LoadXmlFile(earth.RootPath + "trackList" + ".xml");
        tracks = loadXMLStr(tracks).getElementsByTagName("record");
        if (tracks.length <= 0) {
            return;
        }
        var treeObj = $.fn.zTree.getZTreeObj("trackTree");
        var xmlTrackData = earth.UserDocument.LoadXmlFile(earth.RootPath + "\\track\\trackList" + ".xml");
        var xmlDoc = loadXMLStr(xmlTrackData);
        $.each(tracks, function(i, track) {
            var node = treeObj.getNodesByFilter(function(node) {
                return node.id === track.getAttribute("ID");
            }, true); // 仅查找一个节点
            if (node === null || node === "") {
                var records = xmlDoc.getElementsByTagName("record");
                if (records.length > 0) {
                    insertAfter1(track, records[records.length - 1]);
                } else {
                    xmlDoc.documentElement.appendChild(track);
                }

                earth.UserDocument.SaveXmlFile(earth.RootPath + "\\track\\trackList", xmlDoc.xml);
                var xmlTrackData = earth.UserDocument.LoadXmlFile(earth.RootPath + "\\trackList" + track.getAttribute("ID") + ".xml");
                earth.UserDocument.SaveXmlFile(earth.RootPath + "\\track\\trackList" + track.getAttribute("ID"), xmlTrackData);
            } else {
                var deleteXML = earth.RootPath + "\\track\\trackList" + track.getAttribute("ID") + ".xml";
                earth.UserDocument.DeleteXmlFile(deleteXML);
                var xmlTrackData = earth.UserDocument.LoadXmlFile(earth.RootPath + "\\trackList" + track.getAttribute("ID") + ".xml");
                earth.UserDocument.SaveXmlFile(earth.RootPath + "\\track\\trackList" + track.getAttribute("ID"), xmlTrackData);
            }
        });
        initTrackTree();
    });

    /**
     * 保存路径文件
     * @return {[type]} [description]
     */
    var saveTrackList = function() {
        var treeObj = $.fn.zTree.getZTreeObj("trackTree");
        var nodes = treeObj.transformToArray(treeObj.getNodes());
        var i = 0;
        var node = null;
        var xml = "<xml>";
        while (i < nodes.length) {
            node = nodes[i];
            if (node.isParent && node.pId == -1 && node.id != -1) {
                xml += "\n\t<record ID='" + node.id + "' NAME='" + node.name + "' />";
            }
            i++;
        }
        xml += "\n</xml>";
        earth.UserDocument.SaveXmlFile(earth.RootPath + "\\track\\trackList", xml);
    };

    /**
     * 数字保留几位小数
     * @param  {[type]} src [数字]
     * @param  {[type]} pos [保留小数位数]
     * @return {[type]}     [description]
     */
    function fomatFloat(src, pos) {
        return Math.round(src * Math.pow(10, pos)) / Math.pow(10, pos);
    }

    /**
     * 路线节点编辑
     * @param {[type]} station      [路径]
     * @param {[type]} pos          [坐标位置]
     * @param {[type]} passSelected [选择的路径]
     */
    var setStationAttributes = function(station, pos, passSelected) {
        if (!station) {
            return;
        }
        var params = null;
        var bChanged = false;
        var i = 0,
            pt = null;
        var pass = null;
        var position = earth.GlobeObserver.Pose;
        switch (station.Rtti) {
            case 502: // lookat
                params = showModalDialog("lookatSetting.html", {
                    name: station.Name,
                    Longitude: pos ? pos.Longitude : station.Longitude,
                    Latitude: pos ? pos.Latitude : station.Latitude,
                    Altitude: pos ? pos.Altitude : station.Altitude,

                    Heading: pos ? fomatFloat(position.Heading, 1) : fomatFloat(station.Heading, 1),
                    Tilt: pos ? Math.round(position.Tilt) : Math.round(station.Tilt),
                    Roll: pos ? fomatFloat(position.Roll, 1) : fomatFloat(station.Roll, 1),
                    Range: pos ? fomatFloat(position.range, 1) : fomatFloat(station.range, 1),
                    StopTime: station.StopTime
                }, "dialogWidth=294px;dialogHeight=400px;status=no");
                if (params) {
                    station.name = params.name;
                    station.Longitude = params.Longitude;
                    station.Latitude = params.Latitude;
                    station.Altitude = params.Altitude;
                    station.Heading = params.Heading;
                    station.Tilt = params.Tilt;
                    //这里四舍五入一下 底层做度与弧度转换的时候有精度误差
                    station.Tilt = Math.round(station.Tilt);
                    station.Roll = params.Roll;
                    station.range = params.Range;
                    station.StopTime = params.StopTime;
                    bChanged = true;
                }
                break;
            case 503:
                params = showModalDialog("surroundSetting.html", {
                    name: station.Name,
                    Longitude: pos ? pos.Longitude : station.Longitude,
                    Latitude: pos ? pos.Latitude : station.Latitude,
                    Altitude: pos ? pos.Altitude : station.Altitude,
                    FlyHeight: station.FlyHeight,
                    Radius: station.Radius,
                    NumberOfCycle: station.NumberOfCycle,
                    Speed: station.Speed
                }, "dialogWidth=256px;dialogHeight=400px;status=no");
                if (params) {
                    station.name = params.name;
                    station.Longitude = params.Longitude;
                    station.Latitude = params.Latitude;
                    station.Altitude = params.Altitude;
                    station.FlyHeight = params.FlyHeight;
                    station.Radius = params.Radius;
                    station.NumberOfCycle = params.NumberOfCycle;
                    station.Speed = params.Speed;
                    bChanged = true;
                }
                break;
            case 504: // route
                //var name='Station#';
                var name = '路径#'
                var selectNode = treeTrack.getSelectedNodes()[0];
                var track = earth.TrackControl.GetTrack(selectNode.getParentNode().id);
                var paramObj;

                if (track && selectNode.children) {
                    var stat = selectNode.children[0];
                    var stationTemp = track.GetStationByGuid(stat.id);
                    var passTemp = track.GetStationByGuid(selectNode.id);
                    paramObj = {
                        name: station.Name,
                        passSelected: true,
                        Rate: passTemp.Rate,
                        Speed: stationTemp.Speed,
                        FlyHeight: stationTemp.FlyHeight,
                        Tilt: Math.round(passTemp.Pitch),
                        Heading: Math.round(passTemp.Yaw)
                    };
                } else {
                    paramObj = {
                        name: station.Name,
                        passSelected: true,
                        Rate: 0.01
                    };
                }
                //如果pass文件被选中 此时右键的时候 属性显示为其子station的第一个属性值
                params = showModalDialog("routeSetting.html", paramObj, "dialogWidth=276px;dialogHeight=273px;status=no");
                var childrenLen = 0;
                if (selectNode.children && selectNode.id != -1 && selectNode.pId != -1) {
                    childrenLen = selectNode.children.length;
                }
                if (params) {
                    i = 0;
                    station.Name = params.name;
                    station.Yaw = params.Heading;
                    station.Pitch = params.Tilt;
                    if (pos) { // 新建route
                        while (i < pos.Count) {
                            pt = pos.Items(i);
                            pass = earth.Factory.CreateStationPass(earth.Factory.CreateGUID(), '路径#' + (childrenLen + i + 1));
                            pass.Longitude = pt.X;
                            pass.Latitude = pt.Y;
                            pass.Altitude = pt.Z;
                            pass.FlyHeight = params.FlyHeight;
                            pass.Speed = params.Speed;
                            station.AddStation(pass);
                            i += 1;
                        }
                    } else {
                        while (i < station.GetChildCount()) {
                            pass = station.GetChildAt(i);
                            pass.FlyHeight = params.FlyHeight;
                            pass.Speed = params.Speed;
                            i += 1;
                        }
                    }
                    bChanged = true;
                }
                break;
            case 501:
                var param;
                if (passSelected) {
                    param = {
                        name: station.Name,
                        Longitude: pos ? pos.Longitude : station.Longitude,
                        Latitude: pos ? pos.Latitude : station.Latitude,
                        Altitude: pos ? pos.Altitude : station.Altitude,
                        FlyHeight: station.FlyHeight,
                        Speed: station.Speed,
                        passSelected: passSelected
                    }
                } else {
                    param = {
                        name: station.Name,
                        Longitude: pos ? pos.Longitude : station.Longitude,
                        Latitude: pos ? pos.Latitude : station.Latitude,
                        Altitude: pos ? pos.Altitude : station.Altitude,
                        FlyHeight: station.FlyHeight,
                        Speed: station.Speed
                    }
                }

                params = showModalDialog("routeSetting.html", param, "dialogWidth=290px;dialogHeight=273px;status=no");

                if (params) {
                    station.name = params.name;
                    if (!passSelected) {
                        station.Longitude = params.Longitude;
                        station.Latitude = params.Latitude;
                        station.Altitude = params.Altitude;
                    }
                    station.FlyHeight = params.FlyHeight;
                    station.Speed = params.Speed;
                    bChanged = true;
                }
                break;
        }
        return bChanged ? station : null;
    };

    //添加飞行路径 点击"飞行点"触发
    $("#btnStationPass").click(function() {
        top.Tools.disabledAll();
        top.disableAll(true);
        $("#btnNew").attr("disabled", true);
        changeCss("#btnNew", "btnNewDis", "btnNew");
        $("#btnStart").attr("disabled", true);
        $("#video").attr("disabled", true);
        var selNode = treeTrack.getSelectedNodes()[0];
        if ((selNode.id != -1 && selNode.pId != -1 && selNode.isParent) || (selNode.children && selNode.children[0] && selNode.children[0].isParent)) {
            bAppendPass = true;
        }
        earth.Event.OnCreateGeometry = function(pFeat) {
            earth.Event.OnCreateGeometry = function() {};
            earth.ShapeCreator.Clear();
            var route = null,
                pass = null;
            var i = 0,
                pt = null;

            route = curEditingTrack.GetStationByGuid(selNode.id);

            if (route) {
                bAppendPass = true;
                action = "pass";
            } else {
                bAppendPass = false;
                if (pFeat.Count < 3) {
                    alert("路径点不能少于3个");
                } else {
                    action = "飞行点";
                    route = earth.Factory.CreateStationRoute(earth.Factory.CreateGUID(), '飞行点');
                }
            }
            var passStation;
            if (bAppendPass) {
                passStation = setStationAttributes(route, pFeat, true);
                if (passStation) {
                    route.AddStation(passStation);
                } else {
                    return;
                }
            } else {
                route = setStationAttributes(route, pFeat);
            }
            top.Tools.cancelDisabled(top.disabledButtonArr);
            top.disableAll(false);
            if (route) {
                action = " ";
                if (!bAppendPass) {
                    curEditingTrack.AddStation(route);
                }
                curEditingTrack.CommitChanges();
                var stations = trackManager.getStations(curEditingTrack);
                if (bAppendPass) {

                    if (selNode.pId === -1) {
                        treeTrack.removeChildNodes(selNode);
                        treeTrack.addNodes(selNode, stations);
                    } else {
                        treeTrack.removeChildNodes(selNode.getParentNode());
                        treeTrack.addNodes(selNode.getParentNode(), stations);
                    }
                    bAppendPass = false;
                } else {
                    treeTrack.removeChildNodes(selNode);
                    treeTrack.addNodes(selNode, stations);
                }

                //如果当前选中的是pass文件夹 则不可用
                if (selNode.level === 2) {
                    $("#btnStart").attr("disabled", "disabled");
                    $("#video").attr("disabled", "disabled");
                    $("#divShowRoute").attr("disabled", "disabled");
                } else {
                    if (!selNode.children || (selNode.children && selNode.children.length == 0)) {
                        $("#btnStart").attr("disabled", "disabled");
                        $("#video").attr("disabled", "disabled");
                        $("#divShowRoute").attr("disabled", "disabled");
                    } else {
                        $("#btnStart").removeAttr("disabled");
                        $("#video").removeAttr("disabled");
                        $("#divShowRoute").removeAttr("disabled");
                    }

                }

                trackManager.saveTrack(curEditingTrack);
                //添加完毕后 "显示轨迹"勾选
                $("#chkShowRoute").attr("checked", "checked");
                if (curEditingTrack) {
                    curEditingTrack.Visibility = true;
                }
            }
            $("#btnNew").removeAttr("disabled");
            changeCss("#btnNew", "btnNew", "btnNewDis");
            if (!selNode.children || (selNode.children && selNode.children.length == 0)) {
                $("#btnStart").attr("disabled", "disabled");
                $("#video").attr("disabled", "disabled");
            } else {
                $("#btnStart").removeAttr("disabled");
                $("#video").removeAttr("disabled");
            }
        };
        earth.ShapeCreator.CreatePolyline(2, 0xffff0000);
    });

    //点击"观察点"弹出观察点页面
    $("#btnStationLookat").click(function() {
        top.Tools.disabledAll();
        top.disableAll(true);
        $("#btnNew").attr("disabled", true);
        changeCss("#btnNew", "btnNewDis", "btnNew");
        $("#btnStart").attr("disabled", true);
        $("#video").attr("disabled", true);
        var selNode = treeTrack.getSelectedNodes()[0];
        earth.Event.OnCreateGeometry = function(pFeat) {
            earth.Event.OnCreateGeometry = function() {};
            earth.ShapeCreator.Clear();
            var id = earth.Factory.CreateGUID();
            var lookat = earth.Factory.CreateStationLookat(id, "观察点");
            lookat.Range = 100; //设置观察点默认高度值为100
            lookat = setStationAttributes(lookat, pFeat);
            top.Tools.cancelDisabled(top.disabledButtonArr);
            top.disableAll(false);
            if (lookat) {
                curEditingTrack.AddStation(lookat);
                curEditingTrack.CommitChanges();
                var stations = trackManager.getStations(curEditingTrack);

                treeTrack.removeChildNodes(selNode);
                treeTrack.addNodes(selNode, stations);
                trackManager.saveTrack(curEditingTrack);

                //添加完毕后 "显示轨迹"勾选
                $("#chkShowRoute").attr("checked", "checked");
                if (curEditingTrack) {
                    curEditingTrack.Visibility = true;
                }

                $("#btnStart").removeAttr("disabled");
                $("#video").removeAttr("disabled");
                $("#divShowRoute").removeAttr("disabled");
            }
            $("#btnNew").removeAttr("disabled");
            changeCss("#btnNew", "btnNew", "btnNewDis");
            $("#btnStart").removeAttr("disabled");
            $("#video").removeAttr("disabled");
        };
        earth.ShapeCreator.CreatePoint();
    });

    //环绕点
    $("#btnStationSurround").click(function() {
        top.Tools.disabledAll();
        top.disableAll(true);
        $("#btnNew").attr("disabled", true);
        changeCss("#btnNew", "btnNewDis", "btnNew");
        $("#btnStart").attr("disabled", true);
        $("#video").attr("disabled", true);
        var selNode = treeTrack.getSelectedNodes()[0];
        earth.Event.OnCreateGeometry = function(pFeat) {
            earth.Event.OnCreateGeometry = function() {};
            earth.ShapeCreator.Clear();
            var id = earth.Factory.CreateGUID();
            var surround = earth.Factory.CreateStationSurround(id, "环绕点");
            surround.Radius = 200; //环绕点范围半径默认值设置为200
            surround.FlyHeight = 100; //环绕点飞行高度默认值设置为100
            surround = setStationAttributes(surround, pFeat);
            top.Tools.cancelDisabled(top.disabledButtonArr);
            top.disableAll(false);
            if (surround) {
                curEditingTrack.AddStation(surround);
                curEditingTrack.CommitChanges();
                var stations = trackManager.getStations(curEditingTrack);
                treeTrack.removeChildNodes(selNode);
                treeTrack.addNodes(selNode, stations);
                trackManager.saveTrack(curEditingTrack);
                //添加完毕后 "显示轨迹"勾选
                $("#chkShowRoute").attr("checked", "checked");
                if (curEditingTrack) {
                    curEditingTrack.Visibility = true;
                }
                $("#btnStart").removeAttr("disabled");
                $("#video").removeAttr("disabled");
                $("#divShowRoute").removeAttr("disabled");
            }
            $("#btnNew").removeAttr("disabled");
            changeCss("#btnNew", "btnNew", "btnNewDis");
            $("#btnStart").removeAttr("disabled");
            $("#video").removeAttr("disabled");
        };
        earth.ShapeCreator.CreatePoint();
    });
    // endregion

    //添加pass(新建)
    $("#btnNew").click(function() {
        var tracks = trackManager.getTracks();
        var trackName = showModalDialog("getTrackName.html", tracks, "dialogWidth=180px;dialogHeight=90px;status=no;center=yes");
        if (trackName) {
            $.parser.parse('#divTrack');
            bNew = true;
            curEditingTrack = earth.Factory.CreateTrack(earth.Factory.CreateGUID(), trackName);
            var treeObj = $.fn.zTree.getZTreeObj("trackTree");
            var newNode = {
                id: curEditingTrack.Guid,
                pId: -1,
                name: curEditingTrack.Name,
                showActor: false, // 自定义属性：是否显示人
                childOuter: false, //自定义属性:不允许子节点拖拽出去
                isParent: true,
                icon: "../../images/treeIcons/folder.png"
            };
            treeObj.addNodes(treeObj.getNodeByParam("id", -1, null), newNode);

            //添加的路线呈选中状态(貌似不起作用...)
            treeObj.selectNode(treeObj.getNodeByParam("id", newNode.id, null));
            //三个按钮变为可用状态
            $("#btnStationPass").removeAttr("disabled");
            $("#btnStationLookat").removeAttr("disabled");
            $("#btnStationSurround").removeAttr("disabled");
            changeCss("#btnStationPass", "pass", "passDis");
            changeCss("#btnStationLookat", "lookat", "lookatDis");
            changeCss("#btnStationSurround", "surround", "surroundDis");

            //添加pass后 飞行按钮 视频按钮 显示轨迹变为可用
            $("#btnStart").attr("disabled", "disabled");
            $("#video").attr("disabled", "disabled");
            $("#divShowRoute").attr("disabled", "disabled");
            top.Tools.disabledAll();
            top.disableAll(true);
            if (bNew) {
                saveTrackList();
            }
        }
    });

    //功能：飞行
    //参数：trackId飞行路径，dynamicGuid是飞行对象
    function startFlyAction(trackId, dynamicGuid) {
        var track = earth.TrackControl.GetTrack(trackId);
        track.BindObject = dynamicGuid;
        earth.TrackControl.SetMainTrack(trackId, cTrackType);
        track.UpdateRate(2); //维持现状
        track.CommitChanges();
        track.Play(false);
    }

    //几个按钮Hover事件
    $(".trackIcon").mouseover(function(e) {
        var ev = null;
        if (e) {
            ev = e.target;
        } else {
            ev = window.event.srcElement;
        }
        if (ev.disabled) {
            return;
        } else {
            var thisTag = $(ev).attr("tag");
            $(ev).addClass(thisTag + "Hover");
        }
    }).mouseout(function(e) {
        var ev = null;
        if (e) {
            ev = e.target;
        } else {
            ev = window.event.srcElement;
        }
        if (ev.disabled) {
            return;
        } else {
            var thisTag = $(ev).attr("tag");
            $(ev).removeClass(thisTag + "Hover");
        }
    });

    //飞行开始
    $("#btnStart").click(function() {
        if ($("#btnStart").text() == "飞行") {
            if (flyCount <= 0) {
                top.Tools.disabledAll();
                top.disableAll(true);
            }
            flyCount++;
        }
        var trackId = treeTrack.getSelectedNodes()[0].id;
        var node = treeTrack.getSelectedNodes()[0];
        flyNodes.push(node);
        var track = earth.TrackControl.GetTrack(trackId);
        if (track) {
            //飞行过程中设置树右键不可用
            treeTrack.setting.callback.onDblClick = null;
            treeTrack.setting.callback.onRightClick = null;
            if (track.Status == 0) { // stop
                earth.Event.OnDocumentChanged = function(type, newGuid) {
                    if (type == 3) {
                        return;
                    }
                    if (type == 2) { // 飞行对象加载成功
                        changeCss("#btnStationPass", "passDis", "pass");
                        changeCss("#btnStationLookat", "lookatDis", "lookat");
                        changeCss("#btnStationSurround", "surroundDis", "surround");
                        node.icon = "../../images/track/loading.gif";
                        treeTrack.updateNode(node);
                        earth.Event.OnTrackFinish = function(tId, objId) { //这里的tid等于上面的node的id //todo:
                            flyCount--;
                            var selnode = treeTrack.getSelectedNodes()[0];
                            if (flyCount <= 0) {
                                top.Tools.cancelDisabled(top.disabledButtonArr);
                                top.disableAll(false);
                                $("#btnStart").text("飞行");
                                $("#btnStop").attr("disabled", true);
                                node.icon = "../../images/track/folder.png";
                                treeTrack.updateNode(node);
                                $("#chkRealTimeControl").removeAttr("checked");

                                if (selnode != null && selnode.id != -1 && selnode.pId == -1) {
                                    changeCss("#btnStationLookat", "lookat", "lookatDis");
                                    changeCss("#btnStationSurround", "surround", "surroundDis");
                                    $("#btnStationLookat").removeAttr("disabled");
                                    $("#btnStationSurround").removeAttr("disabled");
                                }
                                if (selnode != null && selnode.id == -1) {

                                } else {
                                    changeCss("#btnStationPass", "pass", "passDis");
                                    $("#btnStationPass").removeAttr("disabled");
                                }
                                $("#selFlyObj").removeAttr("disabled");
                                $("#btnNew").removeAttr("disabled");
                                changeCss("#btnNew", "btnNew", "btnNewDis");

                            }

                            if (TrackMap[tId]) {
                                delete TrackMap[tId];
                            }

                            decreaseNumFlying();
                            earth.GlobeObserver.StopTracking();
                            earth.GlobeObserver.Stop();
                            track.Stop();
                            earth.DynamicSystem.UnLoadDynamicObject(objId);



                            //处理飞行后的图标问题
                            for (var i = flyNodes.length - 1; i >= 0; i--) {
                                var currentNode = flyNodes[i];
                                if (tId === currentNode.id) {
                                    //修改飞行完毕后的图标
                                    if (currentNode.open) {
                                        currentNode.icon = "../../images/track/folder.png";
                                    } else {
                                        currentNode.icon = "../../images/track/folder.png";
                                    }
                                    //从数组中删除
                                    flyNodes.splice(i, 1);
                                    break;
                                };
                            };

                            if (tId == treeTrack.getSelectedNodes()[0].id) {
                                $("#btnStop").attr("disabled", "disabled");
                                //处理radio状态
                                $("#btnStart").removeAttr("disabled").text("飞行");
                                $("#chkRealTimeControl,#divRealTimeControl,#divRoleTrack :radio").attr("disabled", "disabled");
                            }
                            var trackNode = earth.TrackControl.GetTrack(selnode.id);
                            if (selnode != null && selnode.id != -1 && selnode.pId == -1 && trackNode.Status != 1 && trackNode.Status != 2) {
                                $("#video").removeAttr("disabled");
                                $("#selFlyObj").removeAttr("disabled");
                            }

                            treeTrack.updateNode(currentNode);

                            if (treeTrack.getSelectedNodes().length > 0) {
                                $("#divShowRoute").removeAttr("disabled");
                            } else {
                                $("#divShowRoute").attr("disabled", "disabled");
                            }

                            //全部飞行完毕后 打开树右键菜单
                            if (flyCount <= 0) {
                                treeTrack.setting.callback.onRightClick = rightClickTrackNode;
                                treeTrack.setting.callback.onDblClick = dblClickTrackNode;
                            }
                        };

                        startFlyAction(trackId, newGuid);
                        enableNew();
                        $("#btnStop,#divRoleTrack :radio,#divChcekControl,#divShowActor,#addspeed,#divRealTimeControl,#chkRealTimeControl").removeAttr("disabled");
                        $("#selFlyObj,#btnNew,#video").attr("disabled", "disabled");
                        changeCss("#btnNew", "btnNewDis", "btnNew");

                        $("#btnStart").text("暂停");
                    }
                    earth.Event.OnDocumentChanged = function() {};
                };
                earth.DynamicSystem.LoadDynamicObject($("#selFlyObj").val());
                TrackMap[track.guid] = $("#selFlyObj").val();
            } else if (track.Status == 1) { // play
                track.Pause();
                enableNew();
                $("#btnStart").removeAttr("disabled").text("继续");
                $("#selFlyObj").attr("disabled", "disabled");
                $("#btnNew,#divRoleTrack :radio,#chkRealTimeControl,#divShowActor").attr("disabled", "disabled");
                changeCss("#btnNewPass", "btnNewDis", "btnNew");

            } else if (track.Status == 2) { // pause
                track.Resume();
                enableNew();
                $("#btnStart").text("暂停");
                $("#selFlyObj").attr("disabled", "disabled");
                $("#btnNew").attr("disabled", "disabled");
                changeCss("#btnNewPass", "btnNewDis", "btnNew");
                $("#divRoleTrack :radio,#chkRealTimeControl,#divRealTimeControl").removeAttr("disabled");
            }
        }
    });

    //停止飞行
    $("#btnStop").click(function() {
        var node = treeTrack.getSelectedNodes()[0];
        var trackId = treeTrack.getSelectedNodes()[0].id;
        var track = earth.TrackControl.GetTrack(trackId);
        if (track) {
            if (videoTag) {
                top.Tools.cancelDisabled(top.disabledButtonArr);
                top.disableAll(false);
                videoTag = false;
                recordState = true;
                isvideo = false;
                $("#video").text("录制");
                setTimeout(endCapture, 500);
            } else {
                track.Stop();
                decreaseNumFlying();
            }

            //按钮状态
            enableNew();
            $("#chkRealTimeControl").removeAttr("checked");
            changeCss("#btnStationPass", "pass", "passDis");
            changeCss("#btnStationLookat", "lookat", "lookatDis");
            changeCss("#btnStationSurround", "surround", "surroundDis");
            if (node.open) {
                node.icon = "../../images/track/folder.png";
            } else {
                node.icon = "../../images/track/folder.png";
            }

            treeTrack.updateNode(node);

            $(this).attr("disabled", "disabled");
            $("#selFlyObj").removeAttr("disabled");
            $("#btnStart").removeAttr("disabled").text("飞行");
            $("#video").removeAttr("disabled").text("视频");
            $("#divRoleTrack :radio,#chkRealTimeControl,#divShowActor,#addspeed,#divRealTimeControl").attr("disabled", "disabled");
            treeTrack.setting.callback.onRightClick = rightClickTrackNode;
            treeTrack.setting.callback.onDblClick = dblClickTrackNode;
        }
    });

    //视频录制
    $("#video").click(function() {
        if (!treeTrack.getSelectedNodes()[0]) {
            alert("请先选择路径")
            return;
        }
        //录制视频添加 暂停/继续 功能
        var btnValue = $("#video").text();
        if (btnValue === "视频") {
            //数据参数清空
            total_frame_count = 0;
            current_frame_count = 0;
            recordState = false;
            var trackId = treeTrack.getSelectedNodes()[0].id;
            videoRecord(trackId);
            if (isvideo) {
                top.Tools.disabledAll();
                top.disableAll(true);
                videoTag = true;
                $("#btnStop").removeAttr("disabled");
                $("#btnStart,#addspeed,#lowspeed").attr("disabled", "disabled");
                treeTrack.setting.callback.onRightClick = "";
                treeTrack.setting.callback.onDblClick = "";
            }
            if (current_frame_count < total_frame_count) {
                $("#video").text("暂停");
            }
        } else if (btnValue === "暂停") {
            setZtreeDisabled(false);
            recordState = true;
            $("#video").text("继续");
        } else if (btnValue === "继续") {
            setZtreeDisabled(true);
            recordState = false;
            $("#video").text("暂停");
            chunk(total_frame_count, captureFrame, endCapture, current_frame_count);
        }
    });

    //track人称控制
    $("#divRoleTrack :radio").click(function() {
        $("#divRoleTrack :radio").removeAttr("checked");
        $(this).attr("checked", "checked");
        var trackId = treeTrack.getSelectedNodes()[0].id;
        earth.TrackControl.SetMainTrack(trackId, $(this).val());
        $("#"+treeTrack.getSelectedNodes()[0].tId+"_span").data("trackType",$(this).val());
        cTrackType = $("#"+treeTrack.getSelectedNodes()[0].tId+"_span").data("trackType");
    });

    $("#chkShowRoute").click(function() {
        var trackId = treeTrack.getSelectedNodes()[0].id;
        var track = earth.TrackControl.GetTrack(trackId);
        if (track) {
            track.Visibility = $(this).attr("checked") == "checked";
        }
    });

    //Track树右键
    $("#divRenameTrack").click(function() {
        var node = treeTrack.getSelectedNodes()[0];
        if (node) {
            var trackName = showModalDialog("getTrackName.html", {
                name: node.name
            }, "dialogWidth=180px;dialogHeight=90px;status=no");
            if (trackName && trackName != node.name) {
                node.name = trackName;
                treeTrack.updateNode(node);
                saveTrackList();
            }
        }
    });

    //删除路径
    $("#divDeleteTrack").click(function() {
        var trackId = treeTrack.getSelectedNodes()[0].id;
        if (trackId) {
            if (confirm("是否确定要删除该条漫游路径？")) {
                treeTrack.removeNode(treeTrack.getSelectedNodes()[0]);
                earth.TrackControl.DeleteTrack(trackId);
                saveTrackList();
                //1.当一个漫游路径都没有的时候 删除tracklist.xml文件(todo)
                //2.如果这里移除的是父节点 就是删除整个tracklist + id .xml文件
                var deleteXML = earth.RootPath + "\\track\\trackList" + trackId + ".xml";
                earth.UserDocument.DeleteXmlFile(deleteXML);

                //删除漫游路径后 按钮状态修改为不可用状态
                $("#btnStationPass").attr("disabled", "disabled");
                $("#btnStationLookat").attr("disabled", "disabled");
                $("#btnStationSurround").attr("disabled", "disabled");
                changeCss("#btnStationPass", "passDis", "pass");
                changeCss("#btnStationLookat", "lookatDis", "lookat");
                changeCss("#btnStationSurround", "surroundDis", "surround");
                //按钮也变为不可用 显示轨迹也变为不可用
                $("#btnStart").attr("disabled", "disabled");
                $("#video").attr("disabled", "disabled");
                $("#divShowRoute").attr("disabled", "disabled");
            }
        }
    });

    //station右键属性编辑
    $("#divEditStation").click(function() {
        var node = treeTrack.getSelectedNodes()[0];
        var station = null;

        if (node.id) {
            station = curEditingTrack.GetStationByGuid(node.id);
            if (node.id != -1 && node.pId != -1 && node.isParent) { //判断右键界面显示内容
                action = "pass";
            }
            var isshow = false;
            if (node.level === 2) {
                isshow = true;
            } else if (node.level === 3) {
                isshow = false;
            }
            if (setStationAttributes(station, null, isshow)) {
                curEditingTrack.CommitChanges();
                node.name = station.Name;
            }
        }
        treeTrack.updateNode(node);
        trackManager.saveTrack(curEditingTrack);
    });

    //当删除pass文件夹或者station节点时候处理
    $("#divDeleteStation").click(function() {
        if (!$(this).attr("disabled")) {
            var node = treeTrack.getSelectedNodes()[0];
            if (node.id) {
                if (confirm("是否确定要删除该节点？")) {
                    var routeNode = node.getParentNode();

                    curEditingTrack.DeleteStation(node.id);
                    curEditingTrack.CommitChanges();
                    treeTrack.removeNode(node);
                    trackManager.saveTrack(curEditingTrack);

                    //当路径node没有子节点的时候 相关按钮变为不可用状态
                    var nodes = routeNode.children;
                    if (nodes.length === 0) {
                        $("#btnStationPass").attr("disabled", "disabled");
                        $("#btnStationLookat").attr("disabled", "disabled");
                        $("#btnStationSurround").attr("disabled", "disabled");
                        changeCss("#btnStationPass", "passDis", "pass");
                        changeCss("#btnStationLookat", "lookatDis", "lookat");
                        changeCss("#btnStationSurround", "surroundDis", "surround");
                        //飞行按钮也不可用
                        $("#btnStart").attr("disabled", "disabled");
                        $("#video").attr("disabled", "disabled");
                    }
                }
            }
        }

        //删除后相关按钮变为不可用
        $("#btnStationPass").attr("disabled", "disabled");
        $("#btnStationLookat").attr("disabled", "disabled");
        $("#btnStationSurround").attr("disabled", "disabled");
        changeCss("#btnStationPass", "passDis", "pass");
        changeCss("#btnStationLookat", "lookatDis", "lookat");
        changeCss("#btnStationSurround", "surroundDis", "surround");
    });

    /**********************************************视频录制 START***************************************************/
    /**
     * 设置ztree禁用与否
     * @param {Boolean} isDis [true:禁用,false:启用]
     */
    function setZtreeDisabled(isDis) {
        $("#trackTree").attr("disabled", isDis);
        if (isDis) {
            $("#upDiv").show();
        } else {
            $("#upDiv").hide();
        }
    }

    /**
     * 视频录制
     */
    function videoRecord(trackId) {
        var obj = {};
        obj.id = trackId;
        obj.earth = earth;
        showModalDialog("videoRecord.html", obj, "dialogWidth=294px;dialogHeight=190px;status=no");
        var track = earth.TrackControl.GetTrack(trackId);
        if (obj.click == "true") {
            setZtreeDisabled(true);
            isvideo = true;
            if (track) {
                // todo 视频录制控制
                total_frame_count = earth.VideoRecorder.BeginCapture(track, obj.outpath, obj.rect, obj.txtFrame);
                $("#btnNew").attr("disabled", "disabled");
                $("#btnStationPass").attr("disabled", "disabled");
                $("#btnStationLookat").attr("disabled", "disabled");
                $("#btnStationSurround").attr("disabled", "disabled");
                changeCss("#btnNew", "btnNewDis", "btnNew");
                changeCss("#btnStationPass", "passDis", "pass");
                changeCss("#btnStationLookat", "lookatDis", "lookat");
                changeCss("#btnStationSurround", "surroundDis", "surround");
                chunk(total_frame_count, captureFrame, endCapture, 0);
            }
        }
    }

    function chunk(len, captureFrame, endCapture, currentFrame) {
        var i = currentFrame;
        setTimeout(function() {
            var count = earth.GetDownloadCount();
            if (count > 0) {
                var time = 1000000;
                var j = 0;
                setTimeout(
                    function sleep(time) {
                        j++;
                        if (j < time)
                            setTimeout(arguments.callee, 20);
                    }, 0);
            } else if (count == 0) {
                if (i > 0)
                    captureFrame(i, len);
                i++;
                current_frame_count = i;
            }
            if (i < len && !recordState) {
                //当单击"暂停"时 由于上一次的函数可能还在执行(有一秒延迟) 因此会多出一帧才真正暂停下来
                setTimeout(arguments.callee, 500);
            } else if (i === len) {
                //录制完毕后变量清零处理
                i = 0;
                total_frame_count = 0;
                current_frame_count = 0;
                //结束录制
                endCapture();
                recordState = false;
                var node = treeTrack.getSelectedNodes()[0];
                changeCss("#btnStationPass", "pass", "passDis");
                changeCss("#btnStationLookat", "lookat", "lookatDis");
                changeCss("#btnStationSurround", "surround", "surroundDis");
                if (node.open) {
                    node.icon = "../../images/track/folder.png";
                } else {
                    node.icon = "../../images/track/folder.png";
                }
                treeTrack.updateNode(node);
                $("#btnNew").removeAttr("disabled");
                changeCss("#btnNew", "btnNew", "btnNewDis");
                $("#btnRecord").text("开始录制");
                $("#btnStop").attr("disabled", "disabled");
                $("#btnStart").removeAttr("disabled");
                treeTrack.setting.callback.onRightClick = rightClickTrackNode;
                treeTrack.setting.callback.onDblClick = dblClickTrackNode;
            }
        }, 0);

    }

    /**
     * 保存某一帧
     * @param  {[type]} i   [description]
     * @param  {[type]} len [description]
     * @return {[type]}     [description]
     */
    function captureFrame(i, len) {
        earth.VideoRecorder.CaptureFrame(i / len);
        var value = (i / len) * 100;
        value = value.toFixed(0);
        value = value / 10;
    }

    /**
     * 停止录制
     * @return {[type]} [description]
     */
    function endCapture() {
        videoTag = false;
        recordState = true;
        isvideo = false;
        setZtreeDisabled(false);
        top.Tools.cancelDisabled();
        top.disableAll(false);
        earth.VideoRecorder.EndCapture();
        $("#video").text("视频");
    }

    /**********************************************视频录制 END***************************************************/

    initTrackTree();

    // 初始化动态对象列表
    trackManager.getDynamicObject(function(dynamic) {}, function(fly) {
        $("#selFlyObj").append('<option value="' + fly.Guid + '">' + fly.Name + '</option>');
    }, $("#selFlyObj"));

    // 页面关闭时删除所有漫游路径
    $(window).unload(function() {
        top.Tools.cancelDisabled(top.disabledButtonArr);
        top.disableAll(false);
        if (earth.GlobeObserver && flyNodes.length > 0) {
            for (var i = 0; i < flyNodes.length; i++) {
                if (flyNodes[i]) {
                    var track = earth.TrackControl.GetTrack(flyNodes[i].id);
                    trackManager.out(track.BindObject);
                }
            }
        }

        if (earth.UserDocument) {
            trackManager.clearTracks();
        }
    });

});