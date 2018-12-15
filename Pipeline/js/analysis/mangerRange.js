/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：区域监测js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;
/**
 * 判断输入等是否合法对按钮进行操作
 */
var validation = function () {
    var value = $("#bufferRadius").val();
    if (isNaN(value) || value < 0.01) {
        if ($("#checkBtn").attr("disabled") != true) {
            $("#checkBtn").attr("disabled", true);
        }
    } else {
        var length = ($("#otherLayersList input:checkbox[checked=checked]")).length;
        if (length > 0) {
            var pipesValue = $("#pipes").val();
            if (pipesValue) {
                if ($("#checkBtn").attr("disabled") == true || $("#checkBtn").attr("disabled") == "disabled") {
                    $("#checkBtn").attr("disabled", false);
                }
            } else {
                $("#checkBtn").attr("disabled", true);
            }

        }
    }
};
$(function () {
    $("#scrollDiv").mCustomScrollbar({});
    //获取url传递过来的type类型 如果是mScope就是管理区 如果是pScope就是保护区
    var impLineType = window.location.href.split("=")[1];
    var polygons = [];
    var modelPolygons = [];
    var queryPipe;
    var queryModel;
    var modelLayerList;
    var modelRecords = [];
    var recordsResult;
    var highlightObj = null;
    var bufPoints;
    var g_vec3s = null;
    $("#typeList").append('<option>' + '管线' + '</option>');
    $("#typeList").append('<option>' + '模型' + '</option>');
    $("#typeList").append('<option>' + '建筑面' + '</option>');
    var lastAreaId = null;//上一个区域显示的图层id
    /**
     * 区域分析点击事件
     */
    $("#areaShow").click(function () {
        var layId = $("#divPipeLineLayersList option:selected").val();
        if ($("#areaShow").text() == "区域分析") {
            lastAreaId = layId;
            $("#areaShow").text("取消分析");
            top.LayerManagement.showBufferLayer(impLineType, layId);
        } else {
            lastAreaId = null;
            $("#areaShow").text("区域分析");
            top.LayerManagement.hideBufferLayer(layId);
        }
    });
    /**
     * 缓冲input框限制输入
     */
    $("#bufferRadius").keyup(function () {
        checkNum($("#bufferRadius")[0], true, 2);
        validation();
    });
    /**
     * 管线图层点击事件
     */
    $("#otherLayersList").click(function () {
        var checkType = $("#typeList").val();
        if (checkType == "管线") {
            var length = ($("#otherLayersList input:checkbox[checked=checked]")).length;
            var radius = $("#bufferRadius").val();
            if (length > 0) {
                if (!radius || radius == 0) {
                    $("#checkBtn").attr("disabled", true);
                } else {
                    var pipeValue = $("#pipes").val();
                    if (pipeValue == "") {
                        $("#checkBtn").attr("disabled", true);
                    } else {
                        $("#checkBtn").attr("disabled", false);
                    }
                }
            } else {
                $("#checkBtn").attr("disabled", true);
            }
            btnEnabled();
        }
    });
    //所有重点管线数组
    var pipeLines = top.LayerManagement.importPipeLines;

    //清除的时候释放资源清除所有高亮与数据
    var clear = function () {
        finallyCoords = [];
        var keys = keyObjDic.Keys().toArray();
        for (var i = 0; i < keys.length; i++) {
            var obj = keyObjDic.item(keys[i]);
            if (obj) {
                obj.StopHighLight();
            }
        }
        clearBuffer();
        clearModelBuffer();
        stopHighLight();
        pipeKeys = [];
        keysAry = [];
        keyObjDic = new ActiveXObject("Scripting.Dictionary");
        finallyObjDic = new ActiveXObject("Scripting.Dictionary");
        finallyCoords = [];
        allPipePoints = [];

        //按钮状态
        $("#clear").attr("disabled", true);
        $("#checkBtn").attr("disabled", true);
        $("#detailData").removeAttr("checked");
        $("#detailData").attr("disabled", "disabled");
        $("#importExcelBtn").attr("disabled", true);

        $("#dg").datagrid({
            pagination: false
        });
        if (lastResult) {
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        $('#dg').datagrid('loadData', {total: 0, rows: []});
        lastResult = false;

        //关闭气泡
        if (top.htmlBalloons) {
            top.htmlBalloons.DestroyObject();
            top.htmlBalloons = null;
        }

        //停止所有闪烁
        if (queryPipe) {
            queryPipe.stopHighLight();
        }
    }

    var btnEnabled = function () {
        var length = ($("#otherLayersList input:checkbox[checked=checked]")).length;
        var value = $("#bufferRadius").val();
        if (!length) {
            $("#clear").attr("disabled", "disabled");
            //当"选取" "清除" "检测" 三个按钮都不可用的时候 是否要清除查询结果
        }
    };

    var pipelineList;//获取到所有管线图层
    var pipes;//选取的管线集合
    var names;//选取的管线名称集合
    var pageSize = 20;//每页显示条数
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var selectedObj = null;
    var bufGeoPoints = null;
    var projectId = top.SYSTEMPARAMS.project;
    var layer = earth.LayerManager.GetLayerByGUID(projectId);
    //获取图层列表
    pipelineList = top.LayerManagement.getPipeListByLayer(layer);
    getLayers();
    function getLayers() {
        pipes = [];
        names = [];
        var len = pipeLines.length;
        for (var i = 0; i < len; i++) {
            var pipeLineLayer = pipeLines[i];
            var layerGUID = pipeLineLayer.guid;
            var layerName = pipeLineLayer.name;
            pipes.push(layerGUID);
            names.push(layerName);
            //初始化重点管线图层列表
            $("#divPipeLineLayersList").append('<option value="' +
                layerGUID + '" server="' + pipeLineLayer.server + '">' +
                pipeLineLayer.name + '</option>');
        }
        $("#bufferRadius").attr("value", pipeLines[0][impLineType]);
    }

    /**
     * 重点管线图层切换事件
     */

    $("#divPipeLineLayersList").change(function () {
        if ($("#areaShow").text() == "取消分析") {
            $("#areaShow").text("区域分析");
            top.LayerManagement.hideBufferLayer(lastAreaId);
        }
        earth.Event.OnPickObjectEx = function () {
        };
        earth.Query.FinishPick();
        earth.Environment.SetCursorStyle(209);
        clear();
        $("#pipes").val("");
        $("#checkBtn").attr("disabled", true);
        var pGUID = $("#divPipeLineLayersList option:selected").val();
        var layer = earth.LayerManager.GetLayerByGUID(pGUID);
        var len = pipeLines.length;
        createPipes();
        //更新查询列表
        getQueryList();
        var len = pipeLines.length;
        for (var i = 0; i < len; i++) {
            var layerGUID = pipeLines[i].guid;
            if (pGUID === layerGUID) {
                $("#bufferRadius").attr("value", pipeLines[i][impLineType]);
            }
        }
    });

    //管线模型之间切换
    $("#typeList").change(function () {
        var checkType = $("#typeList").val();
        if (checkType === "管线") {
            var pGUID = $("#divPipeLineLayersList option:selected").val();
            var layer = earth.LayerManager.GetLayerByGUID(pGUID);
            var len = pipeLines.length;
            createPipes();
            //更新查询列表
            getQueryList();
            var len = pipeLines.length;
            for (var i = 0; i < len; i++) {
                var layerGUID = pipeLines[i].guid;
                if (pGUID === layerGUID) {
                    $("#bufferRadius").attr("value", pipeLines[i][impLineType]);
                }
            }
            $("#otherLayersList").removeAttr("disabled");
            $("#otherLayersList").removeAttr("disabled");
            $("#btnSelectAll").removeAttr("disabled");
            $("#btnSelectReverse").removeAttr("disabled");
            $("#btnSelectNone").removeAttr("disabled");
            $("#checkBtn").attr("disabled", true);
        } else {
            var pipesValue = $("#pipes").val();
            var radius = $("#bufferRadius");
            if (pipesValue && radius) {
                $("#checkBtn").removeAttr("disabled");
            }
            $("#otherLayersList").attr("disabled", true);
            $("#otherLayersList").attr("disabled", true);
            $("#btnSelectAll").attr("disabled", true);
            $("#btnSelectReverse").attr("disabled", true);
            $("#btnSelectNone").attr("disabled", true);
            //"选取"按钮可用
            if (checkType === "模型") {
                //获取楼块图层的name与guid
                modelLayerList = top.LayerManagement.modelLayerList;
            }
        }
    });
    //模型复选框单击事件
    $("#modelChk").click(function () {
        checkBtnDisabled();
    });
    function checkBtnDisabled() {
        var b = $("#pipeLineChk").attr("checked") == "checked";
        var modelChecked = $("#modelChk").attr("checked") == "checked";
        if (!b && !modelChecked) {
            //设置按钮的可见性
            $("#cusAreaBtn").attr("disabled", "disabled");
            $("#checkBtn").attr("disabled", "disabled");
            $("#dataTable").attr("disabled", "disabled");
            $("#queryList").empty();
            $("#detailData").attr("disabled", "disabled");
        } else {
            //设置按钮的可见性
            $("#cusAreaBtn").removeAttr("disabled");
            //装载查询列表
            $("#queryList").empty();
            getQueryList();
            $("#dataTable").removeAttr("disabled");
        }
    }

    createPipes();
    getQueryList();
    function getQueryList() {
        $("#otherLayersList").empty();
        var len = names.length;
        var fontCount = Math.ceil(($("#otherLayersList").width() - 38) / 6);
        var currentGUID = $("#divPipeLineLayersList option:selected").val();
        for (var i = 0; i < len; i++) {

            var thisName = names[i]
            $("#otherLayersList").append('<div id="newP" style="white-space:nowrap;overflow:hidden;padding:1px 0;width:205px;">' +
                '<input type="checkbox" title="' + thisName + '"  id="' + pipes[i] + '" value="' + pipes[i] + '" />' +
                '<label for="' + pipes[i] + '">' + StatisticsMgr.cutString(thisName, fontCount) + '</label>' +
                '</div>');
        }
    }

    /**
     * 选取一根或者多跟管线
     */
    var allPipePoints = [];
    $("#cusAreaBtn").click(function () {
        if ($("#pipes").val()) {
            clear();
            $("#pipes").val("");
        }
        top.LayerManagement.clearHtmlBalloons();
        top.clearLRBDownEvent();
        earth.focus();
        earth.Event.OnPickObjectEx = onPickObjectEx;
        earth.Event.OnLBUp = function (p2) {
            function _onlbd(p2) {
                earth.Event.OnLBDown = function (p2) {
                    earth.Event.OnLBUp = function (p2) {
                        _onlbd(p2);
                    };
                };
                earth.Query.PickObject(24, p2.x, p2.y);
            }

            _onlbd(p2);
        };

        earth.Event.OnRBDown = function (p2) {
            earth.Event.OnLBDown = function () {
            };
            earth.Event.OnRBDown = function () {
            };
            earth.Event.OnPickObjectEx = function () {
            };
            earth.Query.FinishPick();
            earth.Environment.SetCursorStyle(209);
        };

        earth.Environment.SetCursorStyle(32512);
    });

    $(window).unload(function () {
        var keys = keyObjDic.Keys().toArray();
        for (var i = 0; i < keys.length; i++) {
            var obj = keyObjDic.item(keys[i]);
            if (obj) {
                obj.StopHighLight();
            }
        }
    });

    /**
     * 判断已选管段是否在可连续管段之内 如果在 就不允许删除!
     * @param  {[type]} array [description]
     * @param  {[type]} key   [description]
     * @return {[type]}       [description]
     */
    var removeEnabled = function (array, key) {
        var bKey = key.begin;
        var eKey = key.end;
        var b = 0;
        var e = 0;
        for (var i = array.length - 1; i >= 0; i--) {
            var obj = array[i];
            var beginKey = obj.begin;
            var endKey = obj.end;
            if (beginKey === bKey) {
                b++;
            }
            if (endKey === eKey) {
                e++;
            }
            if (beginKey === eKey) {
                b++;
            }
            if (endKey === bKey) {
                e++;
            }
        }
        if (b === 2 && e === 2) {
            return false;
        } else {
            return true;
        }
    };
    /**
     * pick事件
     * @param pObj
     */
    var isLine = true;
    var pointCoords = null;
    var pipeKeys = [];
    var finallyCoords = [];
    var keysAry = [];
    var keyObjDic = new ActiveXObject("Scripting.Dictionary");
    var finallyObjDic = new ActiveXObject("Scripting.Dictionary");
    var allCoordsKey = new ActiveXObject("Scripting.Dictionary");
    var onPickObjectEx = function (pObj) {
        //获取拾取对象key
        var objKey = pObj.GetKey();
        for (var i = 0; i < keysAry.length; i++) {
            if (pipeKeys[i].key === objKey) {
                if (!removeEnabled(pipeKeys, pipeKeys[i])) {
                    alert("该管段不允许删除!");
                    return;
                }
                pipeKeys.splice(i, 1);
            }
            if (keysAry[i] === objKey) {
                var currentObj = keyObjDic.item(objKey);
                currentObj.StopHighLight();
                keysAry.splice(i, 1);

                if (finallyObjDic.item(objKey)) {
                    var coordpts = finallyObjDic.item(objKey);
                    for (var b = finallyCoords.length - 1; b >= 0; b--) {
                        if (coordpts === finallyCoords[b]) {
                            finallyCoords.splice(b, 1);
                        }
                    }
                    ;
                }
                //修改完finallyCoords后 需要修改allPipePoints数组 保证其是两头的坐标 以便进行下一组的坐标判断
                if (finallyCoords[0]) {
                    allPipePoints = [finallyCoords[0][0], finallyCoords[finallyCoords.length - 1][1]];
                }
                return;
            }
        }
        pObj.Underground = true;
        var parentLayerNameTemp = pObj.GetParentLayerName();
        var parentLayerName = parentLayerNameTemp.split("=")[1];
        var str = parentLayerNameTemp.split("=")[1].split("_");
        //获取图层的guid
        var PObjGUID = str[0];
        var layer = earth.LayerManager.GetLayerByGUID(PObjGUID);
        var pGUID = $("#divPipeLineLayersList option:selected").val();
        var pName = $("#divPipeLineLayersList option:selected").text();
        if (layer.guid != pGUID) {
            alert("请选择" + pName + "管线!");
            return;
        }
        var subLayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            subLayer = layer.GetChildAt(i);
            if (subLayer.Name == str[1]) {
                break;
            }
        }
        if (subLayer == null) {
            return;
        }
        var param = subLayer.QueryParameter;
        if (param == null) {
            alert("查询不到结果");
            return;
        }
        param.ClearRanges();
        param.ClearCompoundCondition();
        param.ClearSpatialFilter();
        var result = null, json = null;
        var use_key = top.getName("US_KEY", 1, true);
        param.Filter = "(and,equal," + use_key + "," + objKey + ")";
        param.QueryType = 17;
        if (parentLayerName.indexOf("container") > -1) {
            param.QueryTableType = 1;
            result = subLayer.SearchFromGISServer();
            if (result.RecordCount > 0) {
                $("#clear").removeAttr("disabled");
                json = $.xml2json(result.GotoPage(0));
                if (json.Result.num == 1) {
                    var startKey = top.getName("US_SPT_KEY", 1, true);
                    var endKey = top.getName("US_EPT_KEY", 1, true);
                    var coordsPts = [];
                    var selectedObjStr = json.Result.Record.SHAPE;
                    var usSize = json.Result.Record.US_SIZE;
                    var coords = selectedObjStr.Polyline.Coordinates.split(",");
                    //当前选中管线的坐标
                    coordsPts.push(coords[0] + "," + coords[1] + "," + coords[2], coords[3] + "," + coords[4] + "," + coords[5]);
                    selectedObj = earth.Factory.CreateGeoPoints();

                    if (pipeKeys && pipeKeys.length) {
                        var keysLen = pipeKeys.length;
                        var lastKey = pipeKeys[pipeKeys.length - 1];
                        var tempObj;
                        var isConnect = false;
                        for (var j = 0; j < pipeKeys.length; j++) {
                            if (pipeKeys[j].begin === json.Result.Record[endKey] || pipeKeys[j].end === json.Result.Record[startKey]) {
                                tempObj = pipeKeys[j];
                                isConnect = true;
                            }
                        }
                        if (!isConnect) {
                            alert("请选中连续管段!");
                            return;
                        }
                        if (json.Result.Record[endKey] === tempObj.begin || json.Result.Record[startKey] === tempObj.end) {
                            var tempCoord = [coords[0] + "," + coords[1] + "," + coords[2], coords[3] + "," + coords[4] + "," + coords[5]];
                            finallyObjDic.item(objKey) = tempCoord;
                            allCoordsKey.item(tempCoord) = objKey;
                            //根据x与y进行判断即可
                            var allXY = allPipePoints[1].substring(0, allPipePoints[1].lastIndexOf(","));
                            var coordsPtsXY = coordsPts[0].substring(0, coordsPts[0].lastIndexOf(","));
                            if (allXY === coordsPtsXY) {//第二根的起点等于第一根的终点
                                finallyCoords.push(tempCoord);
                            } else {
                                finallyCoords.unshift(tempCoord);
                            }
                            var finallyLen = finallyCoords.length;
                            allPipePoints = [finallyCoords[0][0], finallyCoords[finallyLen - 1][1]];
                        }
                    }
                    //记录所有的起始编号与终点编号
                    var eptKey = json.Result.Record[endKey];//终点编号
                    var sptKey = json.Result.Record[startKey];//起点编号
                    var keyObj = {begin: sptKey, end: eptKey, key: objKey};
                    pipeKeys.push(keyObj);

                    //每一次查询后的坐标数组
                    var allPipePoints2 = [];
                    //每一根管线都有起始点与终点
                    for (var i = 0; i < coords.length; i += 3) {
                        selectedObj.Add(coords[i], coords[i + 1], coords[i + 2]);
                        allPipePoints2.push(coords[i] + "," + coords[i + 1] + "," + coords[i + 2]);
                        allPipePoints.push(coords[i] + "," + coords[i + 1] + "," + coords[i + 2]);
                    }
                    //去掉重复的起始点数组
                    var tempDic = new ActiveXObject("Scripting.Dictionary");
                    //TODO:
                    for (var v = 0; v < allPipePoints2.length; v++) {
                        tempDic.item(allPipePoints2[v]) = keyObj;
                    }
                    allPipePoints2 = [];
                    var tKeys = tempDic.Keys().toArray();
                    for (var i = 0; i < tKeys.length; i++) {
                        allPipePoints2.push(tKeys[i]);
                    }
                    if (finallyCoords.length === 0) {
                        finallyCoords.push(allPipePoints2);
                        finallyObjDic.item(objKey) = allPipePoints2;
                        allCoordsKey.item(allPipePoints2) = objKey;
                    }
                    pObj.HightLightIsFlash(false);
                    pObj.ShowHighLight();
                    if (keysAry.length < 1) {
                        $("#pipes").val(objKey);
                    } else {
                        $("#pipes").val($("#pipes").val() + "," + objKey);
                    }
                    keysAry.push(objKey);

                    keyObjDic.item(objKey) = pObj;
                    var bufferRadius = $("#bufferRadius").val();
                    var length = ($("#otherLayersList input:checkbox[checked=checked]")).length;
                    var checkType = $("#typeList").val();
                    if (bufferRadius > 0) {
                        if (checkType == "管线") {
                            if (length > 0) {
                                $("#checkBtn").removeAttr("disabled");
                            } else {
                                $("#checkBtn").attr("disabled", true);
                            }
                        } else {
                            $("#checkBtn").removeAttr("disabled");
                        }

                    } else {
                        $("#checkBtn").attr("disabled", true);

                    }
                    $("#detailData").attr("disabled", false);
                }
            }
        }
    };
    /**
     * 显示详细信息
     */
    $("#detailData").click(function () {
        var bShow = $(this).attr("checked") == "checked";
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
        if (queryPipe) {
            queryPipe.setShow(bShow);
        }
    });

    /**
     * 清除生成的缓冲区对象
     */
    var clearBuffer = function () {
        if (polygons && polygons.length) {
            for (var i = polygons.length - 1; i >= 0; i--) {
                var obj = polygons[i];
                earth.DetachObject(obj);
            }
            ;
        }
        polygons = [];

        if (bufPolygon) {
            earth.DetachObject(bufPolygon);
            highlightObj = null;
            bufPolygon = null;
        }
    };

    var stopHighLight = function () {
        if (highlightObj != null) {
            highlightObj.stopHighLight();
            highlightObj = null;
        }
    }

    var clearModelBuffer = function () {
        if (modelPolygons && modelPolygons.length) {
            for (var i = modelPolygons.length - 1; i >= 0; i--) {
                var obj = modelPolygons[i];
                earth.DetachObject(obj);
            }
            ;
        }
        modelPolygons = [];
    };

    function createPipes() {
        //检测除了本身之外的所有管线图层
        pipes = [];
        names = [];
        var pGUID = $("#divPipeLineLayersList option:selected").val();
        var len = pipelineList.length;
        for (var i = 0; i < len; i++) {
            var pipeLineLayer = pipelineList[i];
            if (pipeLineLayer.id != pGUID) {
                pipes.push(pipeLineLayer.id);
                names.push(pipeLineLayer.name);
            }
        }
    };
    var totalNum = 0;
    //开始检测
    $("#checkBtn").click(function () {
        var isPipeChecked = $("#typeList").val();
        var ids = [];
        var layerNames = [];
        var queryTableType = [1];
        $.each($("#otherLayersList input:checkbox[checked=checked]"), function (i, v) {
            var vv = $(v);
            var guid = vv.val();
            ids.push(guid);
            var name = vv.next().text();
            layerNames.push(name);
        });
        if (isPipeChecked === "管线") {
            if (layerNames.length < 1) {
                alert("请选择需要分析的图层");
                return;
            }
        }
        var bufferR = $("#bufferRadius").val();
        if (bufferR < 0.01) {
            alert("请输入正确的半径");
            return;
        }
        divload("tablediv");
        clearBuffer();
        //再次判断管线连续性问题
        //选生成一个缓冲范围 并显示出来
        var pObj = earth.Factory.CreateGeoPoints();
        var corrdTemp = [];
        for (var i = 0; i < finallyCoords.length; i++) {
            var fAry = finallyCoords[i];
            corrdTemp.push(fAry[0], fAry[1]);
        }
        var pointDic = new ActiveXObject("Scripting.Dictionary");
        for (var i = 0; i < corrdTemp.length; i++) {
            var fObj = corrdTemp[i];
            var fObjXY = fObj.substring(0, fObj.lastIndexOf(","));
            if (pointDic.item(fObjXY)) {
                //重复的不处理
            } else {
                pointDic.item(fObjXY) = fObj;
                var coordStrAry = fObj.split(",");
                pObj.Add(coordStrAry[0], coordStrAry[1], coordStrAry[2]);
            }
        }
        ;

        bufPoints = earth.GeometryAlgorithm.CreatePolygonBufferFromPolyline(pObj,
            bufferR, 0, 36);
        if (bufPoints) {
            var vec3s = earth.Factory.CreateVector3s();
            for (var i = 0; i < bufPoints.Count; i++) {
                var pt = bufPoints.GetPointAt(i);
                vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude);
            }
            var bufPolygon = earth.Factory.CreateElementPolygon(earth.Factory.CreateGUID(), "");
            bufPolygon.BeginUpdate();
            bufPolygon.SetExteriorRing(vec3s);   // SECoordinateUnit.Degree
            bufPolygon.LineStyle.LineWidth = 1;
            bufPolygon.LineStyle.LineColor = parseInt("0xFFFF0000");
            bufPolygon.FillStyle.FillColor = parseInt("0x2500FF00");
            bufPolygon.AltitudeType = 1;   // SEAltitudeType.ClampToTerrain
            bufPolygon.EndUpdate();
            earth.AttachObject(bufPolygon);
            polygons.push(bufPolygon);


            g_vec3s = vec3s;
            if (isPipeChecked === "管线") {
                //查询
                var header = ["US_KEY", "US_FEATURE", "layerName"];
                var aliasHeader = ["编号", "类型", "图层"];
                queryPipe = Query.PageHelper(earth);
                queryPipe.setShow(false);
                queryPipe.initParams(ids, layerNames, vec3s, null, 16, queryTableType, header, aliasHeader);
                //怎么在查询之后把鼠标状态修改为平移呢?
                earth.ToolManager.SphericalObjectEditTool.Browse();
            } else if (isPipeChecked === "模型") {
                recordsResult = new ActiveXObject("Scripting.Dictionary");
                modelRecords = [];
                $.each(modelLayerList, function (i, v) {
                    var tempResult = localSearch(v.guid, "", vec3s);
                    if (tempResult != null && tempResult.length > 0) {
                        modelRecords = modelRecords.concat(tempResult);
                    } else if (tempResult != null && tempResult != "") {
                        modelRecords.push(tempResult);
                    }
                });
                initModelDataGrid(modelRecords);
                earth.ToolManager.SphericalObjectEditTool.Browse();
            } else {//建筑面的查询
                var column = [];
                column.push({field: "NAME", title: "名&nbsp;称", width: 180, align: "center"});
                $('#dg').datagrid({
                    columns: [column],
                    pageSize: 10,
                    singleSelect: true,
                    pagination: false,
                    pagination: true,
                    onDblClickRow: function (rowIndex, rowData) {
                        flyToNameSearch(rowData.NAME);
                    }
                });

                totalNum = 0;
                var data = {"total": totalNum, "rows": []};
                if (lastResult) {
                    $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
                }
                ;
                $('#dg').datagrid("loadData", data);
                $('#dg').datagrid({
                    pagination: true
                });
                var values = buildingSearch(0, 10, vec3s);
                var data = {"total": totalNum, "rows": values};
                if (totalNum < 1) {
                    $("#dg").datagrid({
                        pagination: false
                    });
                    $('#dg').datagrid('loadData', {total: 0, rows: []});
                    lastResult = false;
                    divloaded();
                    return;
                }
                $('#dg').datagrid('loadData', data);
                $($(".datagrid-body")[1]).mCustomScrollbar();
                lastResult = true;
                var totalPage = Math.ceil(totalNum / 10);
                if (totalPage < 1) {
                    totalPage = 1;
                }
                //分页属性设置
                var pager = $('#dg').datagrid('getPager');
                pager.pagination({
                    showPageList: false,
                    showRefresh: false,
                    beforePageText: "",
                    afterPageText: "" + totalPage + "页",
                    displayMsg: '',
                    onSelectPage: function (pageNum, pageSize) {
                        var data = {"total": totalNum, "rows": []};
                        if (lastResult) {
                            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
                        }
                        ;
                        $('#dg').datagrid("loadData", data);
                        var values = buildingSearch(pageNum - 1, pageSize, vec3s);
                        var data = {"total": totalNum, "rows": values};
                        $('#dg').datagrid('loadData', data);
                        lastResult = true;
                        $($(".datagrid-body")[1]).mCustomScrollbar();
                    }
                });
            }
            $("#importExcelBtn").attr("disabled", false);
        }
        divloaded();
    });

    var flyToNameSearch = function (nameStr) {
        var queryUrl = top.params.ip + "/dataquery?service=building&qt=17&fd=NAME&project=" + projectId + "&pc=(and,eq,NAME,'" + nameStr + "')&pg=0,10";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null) {
                    alert("无查询数据!");
                    return null;
                }
                var records = json.Result.Record;
                if (records == undefined || json.Result.num <= 0) {
                    alert("无查询数据!");
                    return null;
                }
                var record = null;
                if (json.Result.num == 1) {
                    record = records;
                } else if (json.Result.num > 1) {
                    record = records[0];
                } else {
                    alert("无查询数据!");
                    return null;
                }
                var coords = record.SHAPE.Polygon.Coordinates;
                flyToBuffer(coords, record);
            }
        }
        earth.DatabaseManager.GetXml(queryUrl);
    };
    var bufPolygon = null;
    var flyToBuffer = function (coordinates, record) {
        coordinates = coordinates.split(",");
        var vec3s2 = earth.Factory.CreateVector3s();
        for (var i = 0; i < coordinates.length; i += 3) {
            vec3s2.Add(coordinates[i], coordinates[i + 1], coordinates[i + 2]);
        }

        if (bufPolygon) {
            earth.DetachObject(bufPolygon);
        }

        bufPolygon = earth.Factory.CreateElementPolygon(earth.Factory.CreateGUID(), "");
        bufPolygon.BeginUpdate();
        bufPolygon.SetExteriorRing(vec3s2);   // SECoordinateUnit.Degree
        bufPolygon.LineStyle.LineWidth = 1;
        bufPolygon.LineStyle.LineColor = parseInt("0xFFFF0000");
        bufPolygon.FillStyle.FillColor = parseInt("0x2500FF00");
        bufPolygon.AltitudeType = 1;   // SEAltitudeType.ClampToTerrain
        bufPolygon.EndUpdate();
        earth.AttachObject(bufPolygon);
        bufPolygon.ShowHighLight();
        flyToModel(bufPolygon);

        //显示气泡
        if ($("#detailData").attr("checked") === "checked") {
            //显示气泡  word-break: break-all;word-wrap: break-word; 内容自动换行
            if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
            } else {
                htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:255px;height:275px;font-family:Microsoft Yahei;border:1px solid #ccc;margin-top:15px;margin-bottom:15px"><table style="font-size:16px; color: black">';
            }
            var str = "";
            for (var temp in record) {
                if (temp != "SHAPE") {
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + temp + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + record[temp] + '</td></tr>';
                }
            }
            htmlStr = htmlStr + str + '</table></div>';
            var bounds = bufPolygon.GetLonLatRect().Center;
            var ZValue = earth.Measure.MeasureTerrainAltitude(bounds.X, bounds.Y);
            top.LayerManagement.showHtmlBalloon(bounds.X, bounds.Y, ZValue, htmlStr, 280, 150);
        }
    };
    /**
     * 建筑面查询
     * @param  {[type]} pageIndex  [页码]
     * @param  {[type]} pageSize   [每页条数]
     * @param  {[type]} spatialObj [空间查询条件]
     * @return {[type]}            [description]
     */
    var buildingSearch = function (pageIndex, pageSize, spatialObj) {
        var scStr = "&sc=(2," + spatialObj.Count;
        for (var i = 0; i < spatialObj.Count; i++) {
            scStr += "," + spatialObj.Items(i).X;
            scStr += "," + spatialObj.Items(i).Y;
            scStr += "," + spatialObj.Items(i).Z;
        }
        scStr += ")";

        var queryUrl = top.params.ip + "/dataquery?service=building&qt=17&fd=NAME&project=" + projectId + "&pg=" + pageIndex + "," + pageSize + scStr;
        var xmlDoc = null;
        $.support.cors = true;
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: queryUrl,
            async: false,
            cache: false,
            success: function (data, textStatus, jqXHR) {
                xmlDoc = data;
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                xmlDoc = '';
            }
        });

        var json = $.xml2json(xmlDoc);
        if (json == null) {
            divloaded();
            alert("无查询数据!");
            return null;
        }
        var records = json.Result.Record;
        if (pageIndex == 0 && json.Result.num >= 0) {
            totalNum = json.Result.num;
        }
        if (totalNum <= 0 || records == undefined) {
            divloaded();
            alert("无查询数据!");
            return null;
        }
        var values = [];
        for (var i = 0; i < records.length; i++) {
            var obj = {"NAME": records[i].NAME};
            values.push(obj);
        }
        return values;
    }
    //模型查询走的是localsearch
    var localSearch = function (guid, keyword, spatialObj) {
        var layerObj = earth.LayerManager.GetLayerByGUID(guid);
        top.LayerManagement.searchLayers.push(layerObj);
        var searchParam = layerObj.LocalSearchParameter;
        if (searchParam == null) {
            return;
        }
        searchParam.ClearSpatialFilter();
        if (searchParam == null) {
            return null;
        }
        if (spatialObj != null) {
            searchParam.SetFilter("", "");
            searchParam.SetSpatialFilter(spatialObj);
        }

        var dt = searchParam.ReturnDataType;
        searchParam.PageRecordCount = 1000;
        searchParam.HasDetail = true;
        searchParam.HasMesh = true;
        searchParam.ReturnDataType = top.localSearchDataType.xml
        searchParam.SearchType = 1;//查询模型数据
        var result = layerObj.SearchFromLocal();
        lastLayer = layerObj;
        searchParam.ReturnDataType = dt;
        if (result.RecordCount <= 0) {
            return null;
        }
        //获取模型数据
        searchParam.ReturnDataType = top.localSearchDataType.xml
        var tmpResultXml = result.GotoPage(0);
        searchParam.ReturnDataType = dt;
        //解析模型数据
        var json = $.xml2json(tmpResultXml);
        if (json == null) {
            return null;
        }
        if (json.SearchResult.ModelResult != null && json.SearchResult.ModelResult != "" && json.SearchResult.ModelResult.ModelData != null && json.SearchResult.ModelResult.ModelData != "") {
            var resultR = json.SearchResult.ModelResult.ModelData;
            if (result.RecordCount == 1) {
                recordsResult.item(resultR) = result.GetLocalObject(0);
            } else {
                for (var i = 0; i < resultR.length; i++) {
                    recordsResult.item(resultR[i]) = result.GetLocalObject(i);
                }
            }

            return resultR;
        } else {
            return null;
        }
    }

    var queryModelHandler = function (layerID, feature) {
        var layerID = layerID;
        var feature = feature;
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var str = "sc=(2," + feature.Count;
        for (var j = 0; j < feature.Count; j++) {
            str += "," + feature.Items(j).X.toString() + "," + feature.Items(j).Y.toString() + "," + feature.Items(j).Z.toString();
        }
        str += ")";
        var mQueryString = top.params.ip + "/geoserver?service=" + layerID + "&qt=17&pg=0," + 10000000 + "&" + str;
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null) {
                    return null;
                }
                initModelDataGrid(json);
            }
        }
        earth.DatabaseManager.GetXml(mQueryString);
    };

    var initModelDataGrid = function (records) {
        var dataFiled = [];
        var aliasHeader = [];
        if (records == null || records.length <= 0) {
            alert("检测不到结果");
            $("#dg").datagrid({
                pagination: false
            });
            if (lastResult) {
                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
            }
            ;
            lastResult = false;
            $('#dg').datagrid('loadData', {total: 0, rows: []});
            return;
        }
        var resultNum = records.length;
        var tempRecord;
        var values = [];
        if (resultNum) {
            //获取字段名
            tempRecord = records[0];
            dataFiled = ["SE_NAME", "ParentLayer"];
            aliasHeader = ["名称", "图层"];
            for (var j = 0; j < records.length; j++) {
                var res = records[j];
                var keys = {};
                keys["SE_NAME"] = res["SE_NAME"];
                keys["ParentLayer"] = res["ParentLayer"];
                values.push(keys);
            }

            //数据表格
            var column = [];//OBJECTID_1  要素代码 名称
            for (var k = 0; k < dataFiled.length; k++) {
                column.push({field: dataFiled[k], title: aliasHeader[k], width: 100});
            }
            //给数据表格设置表头
            $("#dg").datagrid({
                pageSize: 20,
                singleSelect: true,
                pagination: true,
                columns: [column],
                onRowContextMenu: function (e, rowIndex, rowData) {
                    e.preventDefault();
                },
                onHeaderContextMenu: function (e, field) {
                    e.preventDefault();
                },
                onDblClickRow: function (rowIndex, rowData) {
                    var modelPolygon;
                    clearModelBuffer();
                    stopHighLight();
                    var options = $('#dg').datagrid('getPager').data("pagination").options;
                    //获取当前页
                    var curr = options.pageNumber;
                    var index = parseInt((curr - 1) * 20) + parseInt(rowIndex);
                    var currentRecord;
                    if (records[index]) {
                        currentRecord = records[index];
                    } else {
                        currentRecord = records;
                    }
                    //获取所有的属性
                    var coords = [];
                    var allf = [];
                    //显示气泡  word-break: break-all;word-wrap: break-word; 内容自动换行
                    if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                        htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
                    } else {
                        htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:255px;height:275px;font-family:Microsoft Yahei;border:1px solid #ccc;margin-top:15px;margin-bottom:15px"><table style="font-size:16px; color: black">';
                    }

                    var str = "";
                    for (var temp in currentRecord) {
                        var everyItem = {};
                        if (temp != "SHAPE") {
                            everyItem[temp] = currentRecord[temp];
                            allf.push(everyItem);
                            str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + temp + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + currentRecord[temp] + '</td></tr>';
                        }
                    }
                    htmlStr = htmlStr + str + '</table></div>';

                    var obj;
                    if (currentRecord.SE_NAME != null && currentRecord.SE_NAME != "") {
                        obj = recordsResult.item(currentRecord);
                    } else {
                        return;
                    }
                    flyToModel(obj);
                    //获取中心点
                    var bounds = obj.GetLonLatRect().Center;
                    var ZValue = earth.Measure.MeasureTerrainAltitude(bounds.X, bounds.Y);
                    //显示气泡
                    if ($("#detailData").attr("checked") === "checked") {
                        top.LayerManagement.showHtmlBalloon(bounds.X, bounds.Y, ZValue, htmlStr);
                    }
                }
            });

            var totalPage = Math.ceil(resultNum / pageSize);

            var firstPages = [];
            for (var f = 0; f < 20; f++) {
                if (values[f]) {
                    firstPages.push(values[f]);
                }
            }
            //加载数据
            var data = {"total": resultNum, "rows": firstPages}
            if (lastResult) {
                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
            }
            ;
            $('#dg').datagrid('loadData', data);
            lastResult = true;
            $($(".datagrid-body")[1]).mCustomScrollbar();
            var pager = $('#dg').datagrid('getPager');
            pager.pagination({
                showPageList: false,
                showRefresh: false,
                beforePageText: "",
                afterPageText: "" + totalPage + "页",
                displayMsg: '',
                onSelectPage: function (pageNum, pageSize) {
                    var beginIndex = (pageNum - 1) * 20;
                    var endIndex = (pageNum) * 20;
                    var firstPages = [];
                    for (var f = beginIndex; f < endIndex; f++) {
                        if (values[f]) {
                            firstPages.push(values[f]);
                        }
                    }
                    var data = {"total": resultNum, "rows": firstPages};
                    if (lastResult) {
                        $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
                    }
                    $('#dg').datagrid('loadData', data);
                    $($(".datagrid-body")[1]).mCustomScrollbar();
                    lastResult = true;
                }
            });
        } else {
            alert("无查询数据!");
        }
    }

    /**
     *功能：显示搜索对象的详细信息
     *参数：obj-要定位查看的搜索对象；key-搜索对象的关键字
     *调用：flyToSearchObject(index)调用
     */
    var htmlBalloons = null;
    var showModelDetailMsg = function (obj, key) {
        if (obj != null) {
            if (htmlBalloons) {
                htmlBalloons.DestroyObject();
                htmlBalloons = null;
            }
            if (htmlBalloons) {
                htmlBalloons.DestroyObject();
                htmlBalloons = null;
            }
            //earth.HtmlBalloon.Hide();
            var rect = obj.GetLonLatRect();
            var north = rect.North;
            var south = rect.South;
            var east = rect.East;
            var west = rect.West;
            var top = rect.MaxHeight;
            var bottom = rect.MinHeight;
            if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                var htmlStr = '<table style="font-size:14px;color:#fffffe;text-align:center;">';
            } else {
                alert(1);
                var htmlStr = '<table style="font-size:14px;color:#black;text-align:center;">';
            }

            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>ID:</td>';
            htmlStr = htmlStr + '<td>' + obj.Guid + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>Name:</td>';
            htmlStr = htmlStr + '<td>' + obj.Name + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>Key:</td>';
            htmlStr = htmlStr + '<td>' + key + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>North:</td>';
            htmlStr = htmlStr + '<td>' + north + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>South:</td>';
            htmlStr = htmlStr + '<td>' + south + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>East:</td>';
            htmlStr = htmlStr + '<td>' + east + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>West:</td>';
            htmlStr = htmlStr + '<td>' + west + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>MaxHeight:</td>';
            htmlStr = htmlStr + '<td>' + top + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '<tr>';
            htmlStr = htmlStr + '<td>MinHeight:</td>';
            htmlStr = htmlStr + '<td>' + bottom + '</td>';
            htmlStr = htmlStr + '</tr>';
            htmlStr = htmlStr + '</table>';
            var centerX = (east + west) / 2;
            var centerY = (north + south) / 2;
            var centerZ = (top + bottom) / 2;
            //earth.HtmlBalloon.Transparence = true;
            var guid = earth.Factory.CreateGuid();
            htmlBalloons = earth.Factory.CreateHtmlBalloon(guid, "balloon");
            htmlBalloons.SetSphericalLocation(centerX, centerY, centerZ);
            if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                htmlBalloons.SetRectSize(370, 245);
                htmlBalloons.SetIsTransparence(false);

            } else {
                htmlBalloons.SetRectSize(410, 295);
                htmlBalloons.SetIsTransparence(false);

            }

            var color = parseInt("0xcc4d514a");//0xccc0c0c0
            htmlBalloons.SetTailColor(color);
            htmlBalloons.SetIsAddCloseButton(true);
            htmlBalloons.SetIsAddMargin(true);
            htmlBalloons.SetIsAddBackgroundImage(true);
            htmlBalloons.SetBackgroundAlpha(0xcc);
            htmlBalloons.ShowHtml(htmlStr);

            OnHtmlBalloonFinishedFunc(guid, function (id) {
                if (htmlBalloons != null) {
                    htmlBalloons.DestroyObject();
                    htmlBalloons = null;
                }
            });
        }
    }

    /**
     * 定位(飞行)到模型搜索数据.
     */
    var flyToModel = function (obj) {
        if (obj == null) {
            return;
        }
        var rect = obj.GetLonLatRect();
        if (rect == null || rect == undefined) return;
        var north = Number(rect.North);
        var south = Number(rect.South);
        var east = Number(rect.East);
        var west = Number(rect.West);
        var topHeight = Number(rect.MaxHeight);
        var bottomHeight = Number(rect.MinHeight);

        var lon = (east + west) / 2;
        var lat = (south + north) / 2;
        var alt = (topHeight + bottomHeight) / 2;
        var width = (parseFloat(north) - parseFloat(south)) / 2;
        var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);
        range += 50;
        earth.GlobeObserver.FlytoLookat(lon, lat, alt, 0, 60, 0, range, 5);
        obj.ShowHighLight();
        highlightObj = obj;
    }

    /**
     * 功能：【导出Excel】按钮onclick事件  RLA142RLA140
     */
    $("#importExcelBtn").click(function () {
        var checkType = $("#typeList").val();
        if (checkType === "管线") {
            $("#importResult>tbody").empty();
            var tempGeoPoints = earth.Factory.CreateGeoPoints();
            for (var j = 0; j < bufPoints.Count; j++) {
                tempGeoPoints.AddPoint(bufPoints.GetPointAt(j));
            }
            var standardName = ["INDEX", "DISPLAYTYPE", "LAYER"];
            $.each($("#otherLayersList input:checkbox[checked=checked]"), function (i, v) {
                var vv = $(v);
                var guid = vv.val();  // checkbox的value值
                var queryTableType = [1];
                for (var j = 0; j < queryTableType.length; j++) {
                    QueryObject.paramQueryALL(tempGeoPoints, guid, null, 16, queryTableType[j], null, null, standardName);
                }
            });
            var tabObj = $("#importResult>tbody")[0];
            var columns = ["编号", "类型", "图层"];
            StatisticsMgr.importExcelByTable(tabObj, columns);
        } else if (checkType === "模型") {
            var resultArr = [];
            for (var i = 0; i < modelRecords.length; i++) {
                var resultObj = [];
                resultObj.push(modelRecords[i].SE_NAME);
                resultObj.push(modelRecords[i].ParentLayer);
                resultArr.push(resultObj);
            }
            var columns = ["名称", "图层"];
            StatisticsMgr.importExcelByTwoArr(resultArr, columns);

        } else {
            var reaultAll = buildingSearch(0, 10000, g_vec3s);
            var resultArr = [];
            for (var i = 0; i < reaultAll.length; i++) {
                resultArr.push(reaultAll[i].NAME);
            }
            var columns = ["名称"];
            StatisticsMgr.importExcelByOneArr(resultArr, columns);
        }
    });

    $(window).unload(function () {
        top.LayerManagement.hideAllBufferLayers();//清除所有区域显示
        clearBuffer();
        StatisticsMgr.detachShere();
        //清除高亮
        //停止所有闪烁
        if (queryPipe) {
            queryPipe.stopHighLight();
        }
        earth.Event.OnLBDown = function () {
        };
        earth.Event.OnRBDown = function () {
        };
        earth.Event.OnPickObjectEx = function () {
        };
        earth.Query.FinishPick();
        earth.Environment.SetCursorStyle(209);
    });
});