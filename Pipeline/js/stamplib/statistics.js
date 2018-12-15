/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：统计公用文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var elementSphere = null;//如果管点没有模型那么创建一个球代替
var id_timeout;//设置elementsphere出现的时间的timer
var StatisticsMgr = {
    earth: null,
    /**
     * 功能：初始化管线图层列表
     * 参数：projectId-指定项目的id编号; container-显示管线图层列表的jquery容器对象; callback-管线初始化完成之后的回调函数
     * 返回：无
     */
    initPipelineList: function (projectId, container, callback) {
        container.html("");
        var layer = earth.LayerManager.GetLayerByGUID(projectId);
        var pipelineList = top.LayerManagement.getPipeListByLayer(layer);
        if (pipelineList == null) {
            return;
        }
        var fontCount = Math.floor((container.width() - 30) / 6);
        for (var i = 0; i < pipelineList.length; i++) {
            var pipeLineLayer = pipelineList[i];
            container.append('<div class="tableListItem">' +
                '<input type="checkbox" server="' + pipeLineLayer.server + '" id="' + pipeLineLayer.id + '" value="' + pipeLineLayer.id + '" name="' + pipeLineLayer.name + '" />' +
                '<label for="' + pipeLineLayer.id + '" title="' + pipeLineLayer.name + '">' + this.cutString(pipeLineLayer.name, fontCount) + '</label>' +
                '</div>');
        }

        if (typeof callback == "function") {
            callback();
        }
    },
    
    /**
     * 初始化管线图层列表，分为点和线，主要是在sql查询使用
     * @param {[string]}  projectId     [指定项目的id编号];
     * @param {[object]}  container     [显示管线图层列表的jquery容器对象];
     * @param {[function]}callback      [管线初始化完成之后的回调函数]
     */
    initPipelinePointLineList: function (projectId, container, callback) {
        container.html("");
        if (projectId == null) return;
        var projectLayer = earth.LayerManager.GetLayerByGUID(projectId);
        var pipelineList = top.LayerManagement.getPipeListByLayer(projectLayer);

        for (var i = 0; i < pipelineList.length; i++) {
            var pipeLineLayer = pipelineList[i];
            container.append('<option value="' +
                pipeLineLayer.id + '" server="' + pipeLineLayer.server + '" title="' + pipeLineLayer.name + '">' +
                pipeLineLayer.name + '线</option>');
            container.append('<option value="' +
                pipeLineLayer.id + '" server="' + pipeLineLayer.server + '" title="' + pipeLineLayer.name + '">' +
                pipeLineLayer.name + '点</option>');
        }

        if (typeof callback == "function") {
            callback();
        }
    },
    /**
     * 初始化管线图层列表在select框中
     * @param {[string]}  projectId     [指定项目的id编号];
     * @param {[object]}  container     [显示管线图层列表的jquery容器对象];
     * @param {[function]}callback      [管线初始化完成之后的回调函数]
     */
    initPipelineSelectList: function (projectId, container, callback) {
        container.html("");
        if (projectId == null) return;
        var layer = earth.LayerManager.GetLayerByGUID(projectId);
        var pipelineList = top.LayerManagement.getPipeListByLayer(layer);
        if (pipelineList == null) {
            return;
        }
        for (var i = 0; i < pipelineList.length; i++) {
            var pipeLineLayer = pipelineList[i];
            container.append('<option value="' +
                pipeLineLayer.id + '" server="' + pipeLineLayer.server + '" title="' + pipeLineLayer.name + '">' +
                pipeLineLayer.name + '</option>');
        }

        if (typeof callback == "function") {
            callback();
        }
    },
    /**
     * 功能：获取指定图层下的所有勾选选中的管线图层列表
     * 参数：layer-指定图层
     * 返回：指定图层下的所有管线图层列表
     */
    getPipeListByLayerChecked: function (layer) {
        var pipelineArr = [];
        var count = layer.GetChildCount();
        var checkCount = $.fn.zTree.getZTreeObj("pipelineLayerTree").getCheckedNodes(true);
        if (checkCount) {
            for (var j = 0; j < checkCount.length; j++) {
                var node = checkCount[j];
                for (var i = 0; i < count; i++) {
                    var childLayer = layer.GetChildAt(i);
                    var layerTypeC = childLayer.LayerType;
                    if (node.id === childLayer.Guid) {
                        if (layerTypeC === "Pipeline") {
                            var pipelineId = childLayer.Guid;
                            top.LayerManagement.searchLayers.push(childLayer);
                            var pipelineName = childLayer.Name;
                            var pipelineServer = childLayer.GISServer;
                            var layerType = childLayer.PipeLineType;
                            pipelineArr.push({
                                id: pipelineId,
                                name: pipelineName,
                                server: pipelineServer,
                                LayerType: layerType
                            });
                        } else {
                            var childCount = childLayer.GetChildCount();
                            if (childCount > 0) {
                                var childPipelineArr = this.getPipeListByLayerChecked(childLayer);
                                for (var k = 0; k < childPipelineArr.length; k++) {
                                    pipelineArr.push(childPipelineArr[k]);
                                }
                            }
                        }
                    }
                }
            }
        }

        return pipelineArr;
    },
    /**
     * 获得字符串实际长度，中文2，英文1
     * @param  {[type]}   str [要获得长度的字符串]
     * @return {[number]}     [字符串长度]
     */
    getStringLength: function (str) {
        var realLength = 0, len = str.length, charCode = -1;
        for (var i = 0; i < len; i++) {
            charCode = str.charCodeAt(i);
            if (charCode >= 0 && charCode <= 128) realLength += 1;
            else realLength += 2;
        }
        return realLength;
    },
    /**
     * js截取字符串，中英文都能用
     * @param str：需要截取的字符串
     * @param len: 需要截取的长度
     */
    cutString: function (str, len) {
        if (this.getStringLength(str) <= len) {
            return str;
        }
        var str_length = 0;
        var str_len = 0;
        str_cut = new String();
        str_len = str.length;
        for (var i = 0; i < str_len; i++) {
            a = str.charAt(i);
            str_length++;
            if (escape(a).length > 4) {
                //中文字符的长度经编码之后大于4  
                str_length++;
            }
            str_cut = str_cut.concat(a);
            if (str_length >= len - 3) {
                str_cut = str_cut.concat("...");
                return str_cut;
            }
        }
        //如果给定字符串小于指定长度，则返回源字符串；  
        if (str_length < len) {
            return str;
        }
    },
    /**
     * 从pipeconfig文件中获取管线编码code对应的管线图层名称
     * @param  {[string]} code [管线编码]
     * @return {[string]} name [管线名称]
     */
    getPipelineConfigNameByCode: function (code) {
        var name = null;
        var pipeConfig = top.SYSTEMPARAMS.pipeConfigDoc;
        if (pipeConfig == null) {
            return;
        }
        var nodes = pipeConfig.getElementsByTagName("PipeCode");
        for (var j = 0; j < nodes.length; j++) {
            var node = nodes[j];
            var configCode = node.selectSingleNode("Code").text;
            var configName = node.selectSingleNode("Name").text;
            if (configCode == code) {
                name = configName;
                break;
            }
        }
        return name;
    },

    /**
     * 功能：从GISServer端获取值域数据。
     * 参数：pipelineId-图层ID；spatial-空间搜索参数；queryType-查询类型；queryTableType-查询表类型；fieldName-值域字段名称
     * 返回：搜索结果
     */
    getValueRangeInfo: function (pipelineId, spatial, queryType, queryTableType, fieldName) {
        var pipeLayer = earth.LayerManager.GetLayerByGUID(pipelineId);
        if (pipeLayer == null) {
            return null;
        }
        var subLayer = null;
        for (var i = 0, len = pipeLayer.GetChildCount(); i < len; i++) {
            subLayer = pipeLayer.GetChildAt(i);
            if (subLayer.Name.toLowerCase() == "container") { // 使用具体的_container图层
                break;
            }
        }
        if (subLayer == null) {
            return;
        }
        var params = subLayer.QueryParameter;
        if (params == null) {
            return null;
        }
        params.Filter = "";
        params.ClearSpatialFilter();
        params.QueryType = queryType;
        params.QueryTableType = queryTableType; //0为点表搜索；1为线表搜索
        var result = subLayer.SearchValueRangeFromGISServer(fieldName);
        return result;
    },

    /**
     *功能：排序函数
     */
    sortNumber: function (a, b) {
        return a - b;
    },

    /**
     * 功能：根据搜索结果获取值域列表。
     * 参数：result - 搜索结果
     * 返回：值域列表。
     */
    getValueRangeList: function (result) {
        if (result == null || result == "") {
            return null;
        }
        var resultDoc = loadXMLStr(result);
        var resultRoot = resultDoc.documentElement;
        if (resultRoot == null) {
            return null;
        }

        var valueRoot = resultRoot.firstChild;
        var valueRangeNode = valueRoot.selectSingleNode("ValueRange");
        if (valueRangeNode == null || valueRangeNode.childNodes.length == 0) {
            return null;
        }

        var valueRangeList = [];
        for (var i = 0; i < valueRangeNode.childNodes.length; i++) {
            valueRangeList.push(valueRangeNode.childNodes[i].text);
        }
        valueRangeList.sort(this.sortNumber);
        return valueRangeList;
    },
    /**
     * 将统计结果显示在左侧面板中
     * @param  {[object]} classResList [统计结果整理后的对象]
     * @param  {[object]} container    [jquery容器,构成的html字符串需要添加的对象]
     * @param  {[string]} columnNum    [除了图层外显示的列数]
     */
    showClassificationResult: function (classResList, container, columnNum) {
        var tdCss = "border-right: 1px double #ACA899;border-bottom: 1px double #ACA899;overflow: auto;";
        var htmlStr = '<table id="exportTab" style="width: 100%;" cellspacing="0" >';
        for (var i = 0; i < classResList.length; i++) {
            var classLayer = classResList[i];
            if (classLayer.dataList.length > 1) {
                for (var k = 0; k < classLayer.dataList.length; k++) {
                    var dataObj = classLayer.dataList[k];
                    htmlStr = htmlStr + '<tr>';
                    if (k == 0 && dataObj["layerName"]) {
                        htmlStr = htmlStr + '<td rowspan="' + (classLayer.dataList.length - 1) + '" style="' + tdCss + '" align="center" width="' + 100 / (columnNum + 1) + '%">' + dataObj["layerName"] + '</td>';
                        k++;
                        dataObj = classLayer.dataList[k];
                        for (var itemIndex in dataObj) {
                            htmlStr = htmlStr + '<td style="' + tdCss + '" align="center" width="' + 100 / (columnNum + 1) + '%">' + dataObj[itemIndex] + '</td>';
                        }
                    } else {
                        for (var itemIndex in dataObj) {

                            htmlStr = htmlStr + '<td style="' + tdCss + '" align="center" width="' + 100 / (columnNum + 1) + '%">' + dataObj[itemIndex] + '</td>';
                        }
                    }
                    htmlStr = htmlStr + '</tr>';
                }
            }
        }
        htmlStr = htmlStr + '</table>';
        divloaded();
        container.html(htmlStr);
    },
    /**
     * 功能：将table导出成Excel文档
     * 参数：tableId - 要导出的表对象; columns - 列标题数组
     * 返回：无
     */
    importExcelByTable: function (tabObj, columns) {
        var xls = null;
        try {
            xls = new ActiveXObject("Excel.Application");
        } catch (e) {
            alert("无法启动Excel\n\n如果您确信您的电脑中已经安装了Excel, 那么请调整IE的安全级别\n" +
                "具体的操作：\n" +
                "工具 -> Internet选项 -> 安全 -> 自定义级别 -> 对没有标记为安全的ActiveX进行初始化和脚本运行 -> 启用");
            return;
        }
        try {
            xls.visible = true;
            var xlsBook = xls.Workbooks.Add;
            var xlsSheet = xlsBook.WorkSheets(1);

            for (var k = 0; k < columns.length; k++) {
                xlsSheet.Cells(1, k + 1).Value = columns[k];
            }

            var rowList = tabObj.rows;
            for (var i = 0; i < rowList.length; i++) {
                var lastJ = null;
                var repeatJ = 0;
                var cellList = rowList[i].cells;
                for (var j = 0; j < cellList.length; j++) {
                    try {
                        var thisClassName = cellList[j].className;
                        if (thisClassName) {
                            var redIndex = thisClassName.indexOf("bgRed");
                            if (redIndex > -1) {
                                xlsSheet.Cells(i + 2, j + 1).Interior.ColorIndex = 3;//如果不符合标准则为红色
                            }
                        }
                        xlsSheet.Cells(i + 2, j + 1).Value = cellList[j].innerHTML;
                    } catch (err) {
                        lastJ = j;
                        repeatJ++;
                        if (repeatJ == 100) {//重复写了5次都没有写成功则返回
                            continue;
                        }
                        j--;

                    }
                }
            }

            xls.UserControl = true;
        } catch (err) {
            alert("出现一个异常:" + err.message);
        }
    },

    /**
     * 功能：将table导出成Excel文档
     * 参数：dataArr - 要导出的一维数组数据; columns - 列标题数组
     * 返回：无
     */
    importExcelByOneArr: function (dataArr, columns) {
        var xls = null;
        try {
            xls = new ActiveXObject("Excel.Application");
        } catch (e) {
            alert("无法启动Excel\n\n如果您确信您的电脑中已经安装了Excel, 那么请调整IE的安全级别\n" +
                "具体的操作：\n" +
                "工具 -> Internet选项 -> 安全 -> 自定义级别 -> 对没有标记为安全的ActiveX进行初始化和脚本运行 -> 启用");
            return;
        }
        try {
            xls.visible = true;
            var xlsBook = xls.Workbooks.Add;
            var xlsSheet = xlsBook.WorkSheets(1);

            for (var k = 0; k < columns.length; k++) {
                xlsSheet.Cells(1, k + 1).Value = columns[k];
            }

            for (var i = 0; i < dataArr.length; i++) {
                xlsSheet.Cells(i + 2, 1).Value = dataArr[i];
            }

            xls.UserControl = true;
        } catch (err) {
            //alert("出现一个异常:" + err.message);
        }
    },

    /**
     * 功能：将table导出成Excel文档
     * 参数：dataArr - 要导出的二维数组数据; columns - 列标题数组
     * 返回：无
     */
    importExcelByTwoArr: function (dataArr, columns) {
        var xls = null;
        try {
            xls = new ActiveXObject("Excel.Application");
        } catch (e) {
            alert("无法启动Excel\n\n如果您确信您的电脑中已经安装了Excel, 那么请调整IE的安全级别\n" +
                "具体的操作：\n" +
                "工具 -> Internet选项 -> 安全 -> 自定义级别 -> 对没有标记为安全的ActiveX进行初始化和脚本运行 -> 启用");
            return;
        }
        try {
            xls.visible = true;
            var xlsBook = xls.Workbooks.Add;
            var xlsSheet = xlsBook.WorkSheets(1);

            for (var k = 0; k < columns.length; k++) {
                xlsSheet.Cells(1, k + 1).Value = columns[k];
            }

            for (var i = 0; i < dataArr.length; i++) {
                for (var j = 0; j < dataArr[i].length; j++) {
                    xlsSheet.Cells(i + 2, j + 1).Value = dataArr[i][j];
                }
            }

            xls.UserControl = true;
        } catch (err) {
            //alert("出现一个异常:" + err.message);
        }
    },

    /**
     * 功能：根据编码，获取编码对应的详细值
     * 参数：type-编码类型；codeId - 编码ID
     * 返回：编码对应的详细值
     */
    getValueByCode: function (type, codeId) {
        var value = "其他";
        if (codeId === "0" || codeId === " " || codeId === "" || codeId === 0 || codeId === undefined) {
            value = "";
            return;
        }
        var a;
        if (!top.SYSTEMPARAMS) {
            a = earth.pipeConfigDoc
        } else {
            a = top.SYSTEMPARAMS.pipeConfigDoc;
        }
        if (a == null) {
            return;
        }
        if (type == "") {
            return;
        }
        var nodes = a.getElementsByTagName(type);
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var codeNode = node.selectSingleNode("Code");
            if (parseFloat(codeNode.text) == parseFloat(codeId)) {
                value = node.selectSingleNode("Name").text;
                break;
            }
        }
        return value;
    },

    //------------------------------------------------------------------------
    //分段统计
    //------------------------------------------------------------------------
    /**
     * 功能：初始化统计范围列表
     * 参数：container-显示统计范围的jquery对象; rangeList-要显示的元素列表
     * 返回：无
     */
    showRangeList: function (container, rangeList) {
        container.html("");
        var htmlStr = '<table style="width:100%;" cellspacing="1">';
        container.append();
        for (var k = 0; k < rangeList.length; k++) {
            htmlStr = htmlStr + '<tr><td style="text-align:left; cursor:default;" onclick="StatisticsMgr.selectSingleRow(this)">' + rangeList[k] + '</td></tr>';
        }
        htmlStr = htmlStr + '</table>';
        container.html(htmlStr);
    },

    /**
     * 功能：在“统计范围”列表中添加一行
     * 参数：downValue-下限值； upValue-上限值; container-统计范围列表的JQuery对象
     */
    appendStatisticsRangeRow: function (downValue, upValue, container, isPositiveInt) {
        var htmlStr = '<tr>';
        htmlStr = htmlStr + '<td class="downLimitTd" onclick="StatisticsMgr.selectSingleRow(this)" ondblclick="StatisticsMgr.editSingleCell(this,' + isPositiveInt + ')">' + downValue + '</td>';
        htmlStr = htmlStr + '<td class="upLimitTd" onclick="StatisticsMgr.selectSingleRow(this)" ondblclick="StatisticsMgr.editSingleCell(this,' + isPositiveInt + ')">' + upValue + '</td>';
        htmlStr = htmlStr + '</tr>';
        container.append(htmlStr);
    },

    /**
     * 功能：单行选择表中的某一行
     * 参数：obj - 选择的表单元格对象
     * 返回：无
     */
    selectSingleRow: function (obj) {
        var trObj = obj.parentNode;
        var tableObj = trObj.parentNode;
        for (var i = 0; i < tableObj.rows.length; i++) {
            tableObj.rows[i].style.color = "#000000";
            tableObj.rows[i].style.backgroundColor = "transparent";
        }
        trObj.style.backgroundColor = "#c2e1fc";
        tableObj.parentNode.selectIndex = trObj.rowIndex;
    },

    /**
     * 功能：使表单元格处于可编辑状态
     * 参数：obj - 选择的表单元格对象
     * 返回：无
     */
    editSingleCell: function (obj, isPositiveInt) {
        var value = obj.innerHTML;
        if (value.toLowerCase().indexOf("<input") != -1) {
            return;
        }
        if (isPositiveInt) {
            obj.innerHTML = '<input  style="width:29px;" onkeyup="checkNum(this, true, 0, 10000)" type="text" value="' + value + '" onfocus="StatisticsMgr.focusSingleCell(this)" onblur="StatisticsMgr.unFocusSingleCell(this)"/>';
        } else {
            obj.innerHTML = '<input  style="width:29px;" onkeyup="checkNum(this, false, 2, 1000)" type="text" value="' + value + '" onfocus="StatisticsMgr.focusSingleCell(this)" onblur="StatisticsMgr.unFocusSingleCell(this)"/>';
        }
        obj.firstChild.focus();
    },

    /**
     * 功能：表单元格编辑框的onfocus事件 - 即编辑框获得焦点的事件
     * 参数：obj - 选择的表单元格对象
     * 返回：无
     */
    focusSingleCell: function (obj) {
        obj.select();
    },

    /**
     * 功能：表单元格编辑框的onblur事件- 即编辑框失去焦点的事件
     * 参数：obj - 选择的表单元格对象
     * 返回：无
     */
    unFocusSingleCell: function (obj) {
        var value = obj.value;
        obj.parentNode.innerHTML = value;
    },
    /**
     * 定位到没有管点的地方并且生成一个圆球
     * @param  {[string]} key         [模型关键字]
     * @param  {[object]} subLayer    [子图层]
     * @param  {[string]} layerID     [管线图层guid]
     * @param  {[string]} pointKey    [点模型关键字]
     * @param  {[type]} bShow       [description]
     * @param  {[type]} originCoord [description]
     * @param  {[type]} htmlStr     [description]
     * @return {[type]}             [description]
     */
    sphereGotoLookat: function (key, subLayer, layerID, pointKey, bShow, originCoord, htmlStr) {
        var deep = 0; //管点埋深
        var pointHeight = 0; //管线半径&高度;
        var US_SPT_KEY = top.getName("US_SPT_KEY", 1, true);
        var filterStartKey = "(and,eq," + US_SPT_KEY + "," + pointKey + ")";

        var US_EPT_KEY = top.getName("US_EPT_KEY", 1, true);
        var filterEndKey = "(and,eq," + US_EPT_KEY + "," + pointKey + ")";

        var lineResult = this.paramQuery(null, layerID, filterStartKey, 16, 1);
        var lintGotoPage = lineResult.GotoPage(0);
        if (lintGotoPage == "error" || (lineResult != null && lineResult.RecordCount < 1)) { //用终点key再次查询
            lineResult = this.paramQuery(null, layerID, filterEndKey, 16, 1);
            lintGotoPage = lineResult.GotoPage(0);
        }
        if (lintGotoPage != "error") {
            var lineJson = $.xml2json(lintGotoPage);
            var lineRecords = lineJson.Result.Record;
            if (typeof(lineRecords) == "object") {
                var lineStartKey = lineRecords[top.getName("US_SPT_KEY", 1, true)];
                var lineEndKey = lineRecords[top.getName("US_EPT_KEY", 1, true)];
                var startDeep = lineRecords[top.getName("US_SDEEP", 1, true)];
                var endDeep = lineRecords[top.getName("US_EDEEP", 1, true)];
                pointHeight = parseInt(lineRecords[top.getName("US_SIZE", 1, true)]);

                if (lineStartKey == pointKey) {
                    deep = startDeep;
                } else if (lineEndKey == pointKey) {
                    deep = endDeep;
                }
            } else if (lineRecords instanceof Array) {
                for (var l = 0; l < lineRecords.length; l++) {
                    var red = lineRecords[l];
                    var lineStartKey = red[top.getName("US_SPT_KEY", 1, true)];
                    var lineEndKey = red[top.getName("US_EPT_KEY", 1, true)];
                    var startDeep = red[top.getName("US_SDEEP", 1, true)];
                    var endDeep = red[top.getName("US_EDEEP", 1, true)];
                    pointHeight = parseInt(lineRecords[top.getName("US_SIZE", 1, true)]);
                    if (lineStartKey == pointKey) {
                        deep = startDeep;
                        break;
                    } else if (lineEndKey == pointKey) {
                        deep = endDeep;
                        break;
                    }
                }
            }
        }

        var uskey = top.getName("US_KEY", 0, true);
        var strPara = "";

        strPara += "(or,equal," + uskey + "," + pointKey + ")";

        var param = subLayer.QueryParameter;
        param.Filter = strPara;
        param.QueryType = 17;
        param.QueryTableType = 0;
        var result = subLayer.SearchFromGISServer();
        var PointResult = result.GotoPage(0);
        var object = result.GetLocalObject(0);
        var json = $.xml2json(PointResult);
        var records = json.Result.Record;
        if (records) {
            if (bShow && htmlStr == null) {
                StatisticsMgr.showNotLineSphere(layerID, records, htmlStr, deep, pointHeight, bShow);
            } else {
                StatisticsMgr.showNotLineBalloon(layerID, records, htmlStr, deep, pointHeight, bShow);
            }
        }
    },
    /**
     * 显示圆球
     * @param layerID 当前图层的guid
     * @param record  显示圆球的当前记录
     * @param htmlStr  html字符串
     * @param deep     埋深
     * @param pointHeight   点高程
     * @param bShow     是否显示详细信息
     */
    showNotLineSphere: function (layerID, record, htmlStr, deep, pointHeight, bShow) {
        //显示气泡  word-break: break-all;word-wrap: break-word; 内容自动换行
        if (top.SYSTEMPARAMS.balloonAlpha > 0) {
            htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
        } else {
            htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:255px;height:275px;font-family:Microsoft Yahei;border:1px solid #ccc;margin-top:15px;margin-bottom:15px"><table style="font-size:16px; color: black">';
        }
        var strKey = record[top.getName("US_KEY", 0, true)];
        var road = record[top.getName("US_ROAD", 0, true)];
        var isScra = record[top.getName("US_IS_SCRA", 0, true)];
        var bdTime = record[top.getName("US_BD_TIME", 0, true)];
        var fxYear = record[top.getName("US_FX_YEAR", 0, true)];
        var owner = record[top.getName("US_OWNER", 0, true)];
        var state = record[top.getName("US_UPDATE", 0, true)];
        var update = record[top.getName("US_UPDATE", 0, true)];
        var altitude = (parseFloat(record[top.getName("US_PT_ALT", 0, true)])).toFixed(3);
        var attachment = record[top.getName("US_ATTACHMENT", 0, true)];
        var pointType = record[top.getName("US_PT_TYPE", 0, true)];

        var str_caption = top.getNameNoIgnoreCase("US_KEY", 0, false);
        var road_caption = top.getNameNoIgnoreCase("US_ROAD", 0, false);
        var isScra_caption = top.getNameNoIgnoreCase("US_IS_SCRA", 0, false);
        var bdTime_caption = top.getNameNoIgnoreCase("US_BD_TIME", 0, false);
        var fxYear_caption = top.getNameNoIgnoreCase("US_FX_YEAR", 0, false);
        var owner_caption = top.getNameNoIgnoreCase("US_OWNER", 0, false);
        var state_caption = top.getNameNoIgnoreCase("US_UPDATE", 0, false);
        var update_caption = top.getNameNoIgnoreCase("US_UPDATE", 0, false);
        var altitude_caption = top.getNameNoIgnoreCase("US_PT_ALT", 0, false);
        var attachment_caption = top.getNameNoIgnoreCase("US_ATTACHMENT", 0, false);
        var pointType_caption = top.getNameNoIgnoreCase("US_PT_TYPE", 0, false);

        //井类型 井直径 井脖深 井底深 井盖类型  井盖规格 井盖材质  井材质  旋转角度  偏心井点号
        var us_well = record[top.getName("US_WELL", 0, true)];
        var us_wdia = record[top.getName("US_WDIA", 0, true)];
        var us_ndeep = (parseFloat(record[top.getName("US_NDEEP", 0, true)])).toFixed(3);
        var us_wdeep = (parseFloat(record[top.getName("US_WDEEP", 0, true)])).toFixed(3);
        var us_plate = record[top.getName("US_PLATE", 0, true)];
        var us_psize = (parseFloat(record[top.getName("US_PSIZE", 0, true)])).toFixed(3);
        var us_pmater = record[top.getName("US_PMATER", 0, true)];
        var us_wmater = record[top.getName("US_WMATER", 0, true)];
        var us_angle = record[top.getName("US_ANGLE", 0, true)];
        var us_offset = record[top.getName("US_OFFSET", 0, true)];

        var us_well_caption = top.getNameNoIgnoreCase("US_WELL", 0, false);
        var us_wdia_caption = top.getNameNoIgnoreCase("US_WDIA", 0, false);
        var us_ndeep_caption = top.getNameNoIgnoreCase("US_NDEEP", 0, false);
        var us_wdeep_caption = top.getNameNoIgnoreCase("US_WDEEP", 0, false);
        var us_plate_caption = top.getNameNoIgnoreCase("US_PLATE", 0, false);
        var us_psize_caption = top.getNameNoIgnoreCase("US_PSIZE", 0, false);
        var us_pmater_caption = top.getNameNoIgnoreCase("US_PMATER", 0, false);
        var us_wmater_caption = top.getNameNoIgnoreCase("US_WMATER", 0, false);
        var us_angle_caption = top.getNameNoIgnoreCase("US_ANGLE", 0, false);
        var us_offset_caption = top.getNameNoIgnoreCase("US_OFFSET", 0, false);

        if (road == undefined) {
            road = "";
        }
        if (isScra == undefined) {
            isScra = "";
        }
        if (bdTime == undefined) {
            bdTime = "";
        }
        if (fxYear == undefined) {
            fxYear = "";
        }
        if (owner == undefined) {
            owner = "";
        }
        if (state == undefined) {
            state = "";
        }
        if (update == undefined) {
            update = "";
        }
        var v3s = null;
        var us_key = top.getName("US_KEY", 0, true);
        var strPara2 = "(and,equal," + us_key + ",";
        strPara2 += strKey;
        strPara2 += ")";
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=point&pc=" + strPara2 + "&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                v3s = getPlaneCoordinates(layerID, xmlDoc, strKey);
                var tv3s = v3s["datumCoord"];
                originCoord = v3s["originCoord"];
                var X = "";
                var Y = "";
                if (tv3s) {
                    X = (parseFloat(tv3s.X)).toFixed(3);
                    Y = (parseFloat(tv3s.Y)).toFixed(3);
                }
                var str = "";
                str += '<tr><td style="word-wrap:break-word;" width="100">&nbsp;&nbsp;&nbsp;&nbsp;' + str_caption + '</td><td style="word-wrap:break-word;" width="150">&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + record[top.getName("US_KEY", 0, true)] + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;X坐标</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + X + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Y坐标</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + Y + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + altitude_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + altitude + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + pointType_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + (pointType == undefined ? "" : pointType) + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + attachment_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + (attachment == undefined ? "" : attachment) + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + road_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + road + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + owner_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + owner + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + bdTime_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + bdTime + '</td></tr>';
                str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + state_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + state + '</td></tr>';
                //井相关字段处理
                if (us_well) {
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_well_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_well + '</td></tr>';
                }
                if (us_wdia && Number(us_wdia)) {
                    us_wdia = Number(us_wdia).toFixed(3);
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_wdia_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_wdia + '</td></tr>';
                }
                if (us_ndeep && Number(us_ndeep)) {
                    us_ndeep = Number(us_ndeep).toFixed(3);
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_ndeep_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_ndeep + '</td></tr>';
                }
                if (us_wdeep && Number(us_wdeep)) {
                    us_wdeep = Number(us_wdeep).toFixed(3);
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_wdeep_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_wdeep + '</td></tr>';
                }
                if (us_plate) {
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_plate_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_plate + '</td></tr>';
                }
                if (us_psize) {
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_psize_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_psize + '</td></tr>';
                }
                if (us_pmater) {
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_pmater_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_pmater + '</td></tr>';
                }
                if (us_wmater) {
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_wmater_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_wmater + '</td></tr>';
                }
                if (us_angle && Number(us_angle)) {
                    us_angle = Number(us_angle).toFixed(3);
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_angle_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_angle + '</td></tr>';
                }
                if (us_offset) {
                    str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_offset_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_offset + '</td></tr>';
                }
                htmlStr = htmlStr + str + '</table></div>';
                StatisticsMgr.showNotLineBalloon(layerID, record, htmlStr, deep, pointHeight, bShow);
            }
        };
        earth.DatabaseManager.GetXml(strConn);
    },
    /**
     * 显示圆球的详细信息
     * @param layerID   管线图层guid
     * @param record    当前圆球的记录
     * @param htmlStr   html字符串
     * @param deep      埋深
     * @param pointHeight   直径
     * @param bShow     是否显示详细信息气泡
     */
    showNotLineBalloon: function (layerID, record, htmlStr, deep, pointHeight, bShow) {
        var earth = top.LayerManagement.earth;
        var pointShape = record.SHAPE.Point.Coordinates;
        var x = null;
        var y = null;
        for (var i = 0; i < pointShape.split(",").length; i += 3) {
            x = pointShape.split(",")[i];
            y = pointShape.split(",")[i + 1];
        }
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var intLayerCode = layer.PipeLineType;
        var h = earth.Measure.MeasureTerrainAltitude(x, y);
        pointHeight = (parseFloat(pointHeight) / 1000) / 2; //半径
        var z = Number(h) - Number(deep) - Number(pointHeight);
        if (intLayerCode >= 4000 && intLayerCode < 5000) {
            z = Number(h) - Number(deep) + Number(pointHeight); //排水
        }
        if (bShow) {
            top.LayerManagement.showHtmlBalloon(x, y, z, htmlStr);
        }
        StatisticsMgr.createElementSphere(x, y, z); //创建球
        earth.GlobeObserver.GotoLookat(x, y, z, 0.0, 89.0, 0, 6);
    },
    /**
     * 创建圆球
     * @param x    经度
     * @param y    纬度
     * @param h    高程
     */
    createElementSphere: function (x, y, h) {
        var radius = 0.3;
        h = h - parseFloat(radius);
        if (elementSphere != null) {
            earth.DetachObject(elementSphere);
            elementSphere = null;
        }
        //获取工厂对象
        var factory = earth.Factory;
        //创建GUID
        var sphereGuid = factory.CreateGUID();
        //创建模型对象
        elementSphere = factory.CreateElementSphere(sphereGuid, "sphere");
        elementSphere.BeginUpdate();
        var lon = x;
        var lat = y;
        var alt = h;
        elementSphere.SphericalTransform.SetLocationEx(lon, lat, alt);
        elementSphere.FillColor = parseInt("0x77ff0000");
        elementSphere.Radius = radius;
        elementSphere.Underground = true;
        elementSphere.EndUpdate();
        earth.ShapeCreator.Clear();
        earth.AttachObject(elementSphere);
        elementSphere.ShowHighLight();
        clearTimeout(id_timeout);
        id_timeout = setTimeout(function () {
            if (elementSphere != null) {
                earth.DetachObject(elementSphere);
                elementSphere = null;
            }
        }, 7000);
    },
    /**
     * 清除双击定位产生的高亮圆球
     */
    detachShere: function () {
        if (elementSphere != null) {
            earth.DetachObject(elementSphere);
            elementSphere = null;
        }
    },
    /**
     * 管线图层查询数据库
     * @param pFeat             查询的空间条件
     * @param guid              要查询的图层的Guid
     * @param filter            查询的属性条件字符串
     * @param queryType         要查询的类型:1,空间；16,属性；17,空间+属性
     * @param queryTableType    查询表类型:0,点表;1,线表
     * @returns {*}
     */
    paramQuery: function (pFeat, guid, filter, queryType, queryTableType) {
        var earth = top.LayerManagement.earth;
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var subLayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            subLayer = layer.GetChildAt(i);
            if (subLayer.LayerType == "Container") { // 使用具体的_container图层
                break;
            }
        }
        if (subLayer == null) {
            return;
        }
        var param = subLayer.QueryParameter;
        param.ClearSpatialFilter();
        if (filter != null) {
            param.Filter = filter;
        }
        if (pFeat != null) {
            param.SetSpatialFilter(pFeat);
        }
        if (queryTableType != null) {
            param.QueryTableType = queryTableType; // 0：SE_Table_Point，1：SE_Table_Line
        }
        param.QueryType = queryType; // SE_AttributeData
        param.PageRecordCount = 12;
        var result = subLayer.SearchFromGISServer();
        return result;
    },
    /**
     * 分段统计
     * @param  {[string]} pipelineId [管线图层的Guid]
     * @param  {[object]} spatial    [空间查询条件]
     * @param  {[number]} low        [最小值]
     * @param  {[number]} upper      [最大值]
     * @param  {[string]} field      [需要显示的字段]
     * @return {[object]} result     [返回的结果]
     */
    statisticsParamQuery: function (pipelineId, spatial, low, upper, field) {
        var layer = earth.LayerManager.GetLayerByGUID(pipelineId);
        var subLayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            subLayer = layer.GetChildAt(i);
            if (subLayer.LayerType == "Container") { // 使用具体的_container图层
                break;
            }
        }
        if (subLayer == null) {
            return;
        }
        var params = subLayer.QueryParameter;
        if (params == null) {
            return null;
        }
        params.ClearCompoundCondition();
        params.ClearSpatialFilter();
        params.ClearRanges();
        params.AddRange(low, upper);
        params.SetClassCountField(field);

        if (spatial != null) {
            params.SetSpatialFilter(spatial);
        }
        params.QueryType = 3;
        params.QueryTableType = 1; //0为点表搜索；1为线表搜索
        var result = subLayer.ClassCountRange();
        return result;
    },
    /**
     * 统计符合条件的管线以及管点
     * @param  {[string]} pipelineId        [管线guid]
     * @param  {[object]} spatial           [空间查询条件]
     * @param  {[string]} field             [需要显示的字段]
     * @param  {[number]} queryTableType    [统计点还是线]
     * @param  {[string]} filter            [属性查询条件]
     * @param  {[string]} compoundCondition [跨表查询条件]
     * @return {[type]}                   [description]
     */
    statisticsTypeParamQuery: function (pipelineId, spatial, field, queryTableType, filter, compoundCondition) {
        var layer = earth.LayerManager.GetLayerByGUID(pipelineId);
        var subLayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            subLayer = layer.GetChildAt(i);
            if (subLayer.LayerType == "Container") { // 使用具体的_container图层
                break;
            }
        }
        if (subLayer == null) {
            return;
        }
        var params = subLayer.QueryParameter;
        if (params == null) {
            return null;
        }
        params.ClearCompoundCondition();
        params.ClearSpatialFilter();
        params.ClearRanges();
        if (compoundCondition != null) {
            var cc = compoundCondition.split(",");
            params.SetCompoundCondition(cc[0], cc[1], parseFloat(cc[2]).toFixed(3));
        }

        if (field != null) {
            params.SetClassCountField(field);
        }

        if (spatial != null) {
            params.SetSpatialFilter(spatial);
        }
        params.Filter = "";
        if (filter != null) {
            params.Filter = filter;
        }
        params.QueryType = 3;
        params.QueryTableType = queryTableType; //0为点表搜索；1为线表搜索
        var result = subLayer.ClassCount();
        return result;
    },
    /**
     * 解析统计结果
     * @param  {[string]}  result          [统计结果xml字符串]
     * @param  {[object]}  classLayer      [所有信息集合,这个方法主要是在改变这个对象的值]
     * @param  {[string]}  field           [统计的字段名]
     * @param  {[Boolean]} isPointOrAttach [是否是附属物或者特征分类]
     * @param  {[Boolean]}  isLength            [description]
     * @return {[type]}                  [description]
     */
    parseResult: function (result, classLayer, field, isPointOrAttach, isLength){
        if (result != "") {
            var json = $.xml2json(result);
            if (json == null || json == "") {
                return
            }
            var items = json.Item;
            var len = items.length;

            if (typeof len == "number") {
                var lengthCount = 0;
                var numCount = 0;
                for (var i = 0; i < len; i++) {
                    var item = items[i];
                    var subtotal = StatisticsMgr.getItem(item, classLayer, field, isLength);
                    lengthCount = parseFloat(lengthCount) + parseFloat(subtotal.split(",")[0]);
                    numCount = parseFloat(numCount) + parseFloat(subtotal.split(",")[1]);
                }
                if (numCount != 0) {
                    if (isPointOrAttach) {
                        classLayer.dataList.push({
                            dataType: "小计",
                            dataNum: numCount
                        });  
                    } else {
                        classLayer.dataList.push({
                            dataType: "小计",
                            dataNum: numCount,
                            length: lengthCount == 0 ? "-" : parseFloat(lengthCount).toFixed(3)
                        });
                    }
                } else {
                    var otherObj = StatisticsMgr.arrSort(classLayer.dataList);
                    if (otherObj) {
                        classLayer.dataList = StatisticsMgr.arr_del(classLayer.dataList, otherObj.index + 1);
                        if (isPointOrAttach) {
                            classLayer.dataList.push({
                                dataType: "其他",
                                dataNum: otherObj.dataNum
                            });
                        } else {
                            classLayer.dataList.push({
                                dataType: "其他",
                                length: "-",
                                dataNum: otherObj.dataNum
                            });
                        }
                    }
                    if (isPointOrAttach) {
                        classLayer.dataList.push({
                            dataType: "小计",
                            dataNum: lengthCount
                        });
                    } else {
                        classLayer.dataList.push({
                            dataType: "小计",
                            dataNum: lengthCount,
                            length: "-"
                        });
                    }
                }
            } else {
                var lengthCount = 0;
                var numCount = 0;
                var subtotal = StatisticsMgr.getItem(items, classLayer, field, isLength);
                lengthCount = parseFloat(lengthCount) + parseFloat(subtotal.split(",")[0]);
                numCount = parseFloat(numCount) + parseFloat(subtotal.split(",")[1]);
                if (numCount != 0) {
                    if (isPointOrAttach) {
                        classLayer.dataList.push({
                            dataType: "小计",
                            dataNum: numCount,
                        });
                    } else {
                        classLayer.dataList.push({
                            dataType: "小计",
                            dataNum: numCount,
                            length: lengthCount == 0 ? "-" : parseFloat(lengthCount).toFixed(3)
                        }); 
                    }
                } else {
                    var otherObj = StatisticsMgr.arrSort(classLayer.dataList);
                    if (otherObj) {
                        classLayer.dataList = StatisticsMgr.arr_del(classLayer.dataList, otherObj.index + 1);
                        if (isPointOrAttach) {
                            classLayer.dataList.push({
                                dataType: "其他",
                                dataNum: otherObj.dataNum
                            });
                        } else {
                            classLayer.dataList.push({
                                dataType: "其他",
                                length: "-",
                                dataNum: otherObj.dataNum
                            }); 
                        }
                    }
                    if (isPointOrAttach) {
                        classLayer.dataList.push({
                            dataType: "小计",
                            dataNum: lengthCount
                        });
                    } else {
                        classLayer.dataList.push({
                            dataType: "小计",
                            dataNum: lengthCount,
                            length: "-"
                        });
                    }
                    
                }
            }
        }
    },
    fieldClassification: function (spatial, fields, filter, compoundCondition, chartTitle, obj) { //行政区统计 埋设统计
        divload("tablediv");
        var classResList = [];
        //要传递到chart统计的数据
        var layers = [];
        var isPointOrAttach = chartTitle == "特征分类统计图" || chartTitle =="附属物分类统计图" ? true : false;
        var headerFields;
        if (isPointOrAttach) {
            headerFields = [{
                pointType: "点性质"
            }, {
                pointNum: "点数"
            }];
        } else {
            headerFields = [{
                dataType: "埋深"
            }, {
                dataNum: "数量"
            }, {
                length: "长度"
            }];
        }

        $(":checkbox:checked").each(function () {
            var layerId = $(this).val();
            var layerName = $(this).next("label").attr("title") ? $(this).next("label").attr("title") : $(this).next("label").html();
            layers.push(layerName);
            var classLayer = {
                chartTitle: chartTitle,
                layer: layers,
                fields: headerFields,
                dataList: [{
                    layerName: layerName
                }]
            };
            if(typeof fields == "string"){//表示只需要查一个字段,由标准字段名称+"0"/"1"组成
                var thisField = fields.split(",")[0];
                var tableType = fields.split(",")[1];
                thisField = top.getName(thisField, tableType, true);
                result = StatisticsMgr.statisticsTypeParamQuery(layerId, spatial, thisField, tableType, filter, compoundCondition);
                StatisticsMgr.parseResult(result, classLayer, thisField, isPointOrAttach ,false);
            } else {//一般是查询图层的管点和管线,管点一般是查附属物字段,管线一般查材质字段
                for (var c = 0; c < fields.length; c++) {
                    var field = fields[c];
                    var result = "";
                    if (field == "US_ATTACHMENT") {
                        field = top.getName("US_ATTACHMENT", 0, true);
                        if (chartTitle === "埋设统计图") {
                            if (obj) {
                                var ptField = top.getName(obj["field"], 0, true); //管点
                                if (!ptField || ptField.toLowerCase() == "undefined") {
                                    continue;
                                }
                                var bTime = obj["bTime"];
                                var eTime = obj["eTime"];
                                filter = "(and,greaterequal," + ptField + "," + bTime + ")(and,lessequal," + ptField + "," + eTime + ")";
                            }
                        }
                        if (chartTitle === "废弃分类统计图") {
                            var usStatus = top.getName("US_STATUS", 0, true);
                            if (!usStatus || usStatus.toLowerCase() == "undefined") {
                                continue;
                            }
                            //从valueconfig.map中根据 废弃 找对应的值
                            var statueType = top.getStatusType("废弃", false);
                            filter = "(and,equal," + usStatus + "," + statueType + ")";
                        }
                        result = StatisticsMgr.statisticsTypeParamQuery(layerId, spatial, field, 0, filter, compoundCondition);

                    } else {
                        field = top.getName("US_PMATER", 1, true);
                        if (chartTitle === "埋设统计图") {
                            if (obj) {
                                var lineField = top.getName(obj["field"], 1, true); //管线
                                if (!lineField || lineField.toLowerCase() == "undefined") {
                                    continue;
                                }
                                var bTime = obj["bTime"];
                                var eTime = obj["eTime"];
                                filter = "(and,greaterequal," + lineField + "," + bTime + ")(and,lessequal," + lineField + "," + eTime + ")";
                            }
                        }
                        if (chartTitle === "废弃分类统计图") {
                            var usStatus = top.getName("US_STATUS", 1, true);
                            if (!usStatus || usStatus.toLowerCase() == "undefined") {
                                continue;
                            }
                            //从valueconfig.map中根据 废弃 找对应的值
                            var statueType = top.getStatusType("废弃", false);
                            filter = "(and,equal," + usStatus + "," + statueType + ")";
                        }
                        result = StatisticsMgr.statisticsTypeParamQuery(layerId, spatial, field, 1, filter, compoundCondition);
                    }
                    StatisticsMgr.parseResult(result, classLayer, field, isPointOrAttach, true);
                }
            }
            
            classResList.push(classLayer);
        });
        return classResList;
    },
    /**
     * 判断arr有没有别的类型为其他的点
     * @param  {[Array]} arr [统计结果]
     * @return {[type]}     [description]
     */
    arrSort: function (arr) {
        var otherDataObj = null;
        for (var i = 0; i < arr.length; i++) {
            var a = arr[i];
            if (a.dataType == "其他") {
                otherDataObj = {
                    index: i,
                    dataNum: a.dataNum
                };
                break;
            }
        }
        return otherDataObj;
    },
    arr_del: function (arr, d) {
        return arr.slice(0, d - 1).concat(arr.slice(d));
    },
    /**
     * 统计的时候对一条记录进行解析，得到数量、长度以及显示字段
     * @param  {[Object]} item       [当前需要解析的记录]
     * @param  {[object]} classLayer [需要显示在左侧table的]
     * @param  {[string]} field      [需要显示的字段]
     * @param  {[Boolean]} isLength      [true,需要统计长度;false,不需要统计长度]
     * @param  {[string]} layerCode  [管线图层编码]
     * @return {[string]}            [长度和数量的拼接字符串]
     */
    getItem: function (item, classLayer, field, isLength, layerCode) { //todo:这里用管线还是用管点???
        var usAttachment = top.getName("US_ATTACHMENT", 0, true);
        var pointTypeValue = item[usAttachment]; //附属物
        var nameType = "Attachment";
        if (!pointTypeValue) {
            usAttachment = top.getName("US_PT_TYPE", 0, true);
            pointTypeValue = item[usAttachment]; //特征
            nameType = "PointType";
        }
        if (!pointTypeValue) {
            usAttachment = top.getName("US_SIZE", 0, true);
            pointTypeValue = item[usAttachment]; //管径
        }
        if (!pointTypeValue) {
            usAttachment = top.getName("US_PWIDTH", 0, true);
            pointTypeValue = item[usAttachment]; //管块
        }
        if (!pointTypeValue) {
            usAttachment = top.getName("US_PMATER", 0, true);
            pointTypeValue = item[usAttachment]; //材质
            nameType = "MaterialType";
        }
        if (!pointTypeValue) {
            usAttachment = top.getName("US_OWNER", 0, true);
            pointTypeValue = item[usAttachment]; //权属单位
        }
        if (!pointTypeValue) {
            usAttachment = top.getName("US_BD_TIME", 0, true);
            pointTypeValue = item[usAttachment]; //建设年代
        }
        if (!pointTypeValue) {
            usAttachment = top.getName("US_SIZE",0,true);
            pointTypeValue=item[usAttachment];//管径统计
        }
        pointTypeValue = top.getCaptionByCustomValue(layerCode, nameType, pointTypeValue);
        var pointType = pointTypeValue;

        if (!pointType) {
            pointType = item[field];
            if (field == "MATERIAL") {
                nameType = "MaterialType";
                pointType = pointTypeValue = top.getCaptionByCustomValue(layerCode, nameType, pointType);
            }
            if (!pointType) {
                pointType = "其他";
            }
        }
        var lengthCount = 0;
        var numCount = 0;
        var totalLength = item.length;
        if (isLength) {
            if (totalLength) {
                var dataNum = item.Times;
                totalLength = parseFloat(totalLength / 1000).toFixed(3);
                classLayer.dataList.push({
                    dataType: pointType,
                    dataNum: dataNum,
                    length: totalLength
                });
                lengthCount = parseFloat(lengthCount) + parseFloat(totalLength);
                numCount = parseFloat(numCount) + parseFloat(dataNum);
            } else {
                var dataNum = item.Times;
                classLayer.dataList.push({
                    dataType: pointType,
                    dataNum: dataNum,
                    length: "-"
                });
                lengthCount = parseFloat(lengthCount);
                numCount = parseFloat(numCount) + parseFloat(dataNum);
            }
        } else {
            if (totalLength) {
                var dataNum = item.Times;
                if (pointType != "其他" && pointType != "0") {
                    totalLength = parseFloat(totalLength / 1000).toFixed(3);
                    classLayer.dataList.push({
                        dataType: pointType,
                        dataNum: dataNum,
                        length: totalLength
                    });
                    lengthCount = parseFloat(lengthCount) + parseFloat(totalLength);
                    numCount = parseFloat(numCount) + parseFloat(dataNum);
                }
            } else {
                var dataNum = item.Times;
                if (dataNum) {
                    classLayer.dataList.push({
                        dataType: pointType,
                        dataNum: dataNum
                    });
                    lengthCount = parseFloat(lengthCount);
                    numCount = parseFloat(numCount) + parseFloat(dataNum);
                }
            }
        }
        return lengthCount + "," + numCount;
    }
};
/**
 * 为了解决窗口变化左侧面板布局不对
 */
$(window).resize(function () {
    setGridScrollHeight();
});