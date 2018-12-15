/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：纵断面分析js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var gCanvas = document.getElementById("gCanvas");
gCanvas.Rotation = 270;
// Y轴竖线
function createYLine() {
    var yLine = document.createElement("v:line");
    yLine.style.zIndex = 5;
    yLine.StrokeWeight = 1;
    yLine.From = "0,125";
    yLine.To = "450,125";
    gCanvas.appendChild(yLine);
}
// Y轴竖线刻度
function createYTick() {
    var start = 150, step = 50, iTick = 0, yTick = null;
    while (iTick <= 4) {
        yTick = document.createElement("v:line");
        yTick.StrokeWeight = 1;
        yTick.style.zIndex = 5;
        yTick.FillColor = "red";
        yTick.From = 100 + (start + iTick * step) + ",125";
        yTick.To = 100 + (start + iTick * step) + ",130";
        gCanvas.appendChild(yTick);
        iTick += 1;
    }
}
// Y轴竖线刻度值
function createYTickValue(maxGroundAltitude, minPipeLineAltitude) {
    var textPoint = 0;
    var altitude = (parseFloat(Math.abs(maxGroundAltitude - minPipeLineAltitude) / 4)).toFixed(2);
    var minValue = (parseFloat(minPipeLineAltitude)).toFixed(2);
    for (var i = 0; i <= 4; i++) {
        var py = i * 50 + 110;
        textPoint = parseFloat(altitude) * i + parseFloat(minValue);
        textPoint = (textPoint).toFixed(2);
        var newShape = document.createElement("<v:shape style='position:absolute;left:" + (py - 50) + ";top:90;WIDTH:200px;HEIGHT:150px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>")
        gCanvas.insertBefore(newShape);
        var newText = document.createElement("<v:textbox id='ty" + textPoint + "' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline'></v:textbox>");
        newShape.insertBefore(newText);
        newText.innerHTML = textPoint;
    }
}
// 表格标题
function createTableTitle() {
    var titles = ["埋深(m)", "规格(mm)", "间距(m)", "管线高程", "地面高程"];
    var i = 0;
    var rectBox = null, txtPath = null;
    while (i < titles.length) {
        rectBox = document.createElement("v:rect");
        rectBox.style.left = 0 + i * 40;
        rectBox.className = "rectTitle";
        txtPath = document.createElement("v:textbox");
        txtPath.innerText = titles[i];
        rectBox.appendChild(txtPath);
        gCanvas.appendChild(rectBox);
        i += 1;
    }
}

// 管线剖面点
function createPipeStartProfile(pipeLineObj, x, y, yy, type) {
    var r = 5;
    var circle = null;
    if (type === "circle") {
        circle = document.createElement("v:oval");
    } else {
        circle = document.createElement("v:Rect");
    }
    circle.style.left = x - r;
    circle.style.top = y - r;
    circle.style.zIndex = 5;
    circle.style.width = r * 2;
    circle.style.height = r * 2;
    circle.style.cursor = "pointer";
    circle.FillColor = pipeLineObj.fillcolor;
    circle.Stroked = "t";
    circle.onmouseenter = function () {
        var divStr = '<table align="right">';
        divStr += '<tr class="colClass1"><td class="rightTd">数据类型：</td><td>' + pipeLineObj.dataType + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">编号：</td><td id="id">' + pipeLineObj.ID + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">规格：</td><td>' + pipeLineObj.specification + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">材质：</td><td>' + pipeLineObj.mater + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">横坐标：</td><td>' + pipeLineObj.startCoordX + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">纵坐标：</td><td>' + pipeLineObj.startCoordY + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">管线高程：</td><td>' + pipeLineObj.dxPipeLineStartAlt + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">地面高程：</td><td>' + pipeLineObj.dataStartAlt + '</td></tr>';
        divStr += '</table>';
        $("#divHover").html(divStr);
        $("#divHover").show();

        if ($(this).offset().left + 15 + $("#divHover").width() > 1000 + 60) {
            $("#divHover").css("left", $(this).offset().left - 5 - $("#divHover").width());
        } else {
            $("#divHover").css("left", $(this).offset().left + 15);
        }
        if ($(this).offset().top + 15 + $("#divHover").height() > 600 + 100) {
            $("#divHover").css("top", $(this).offset().top - 5 - $("#divHover").height());
        } else {
            $("#divHover").css("top", $(this).offset().top + 15);
        }
    };
    circle.onmouseout = function () {
        $("#divHover").hide();
    }
    circle.onclick = function () {
        circle.Stroked = "f";
        //circle.FillColor = "red";
        var x = event.screenX - 100;
        var y = event.screenY - 250;
        newWin = window.showModalDialog("MessageBox.html?t=" + pipeLineObj.dataType + "&i=" + pipeLineObj.ID + "&s=" + pipeLineObj.specification + "&m=" + pipeLineObj.mater +
            "&x=" + pipeLineObj.startCoordX + "&y=" + pipeLineObj.startCoordY + "&p=" + pipeLineObj.dxPipeLineStartAlt + "&g=" + pipeLineObj.dataStartAlt
            , "_blank", "dialogWidth=220px;dialogHeight=220px,top=" + y + ",left=" + x + ",toolbar=no,menubar=no,scrollbars=no, resizable=no,location=no,status=no");
    };
    gCanvas.appendChild(circle);

    var plotLine = document.createElement("v:line");
    plotLine.style.zIndex = 4;
    plotLine.Stroked = "true";
    plotLine.StrokeWeight = 1;
    var stroke = document.createElement("v:stroke");
    stroke.DashStyle = "dash";
    plotLine.StrokeColor = "black";
    plotLine.appendChild(stroke);
    plotLine.From = x + "," + y;
    plotLine.To = "0" + "," + y;
    gCanvas.appendChild(plotLine);
    insertStartDataToTable(pipeLineObj, y, yy);
}
// 管线剖面点
function createPipeEndProfile(pipeLineObj, x, y, yy, type) {
    var r = 5;
    var circle = null;
    if (type === "circle") {
        circle = document.createElement("v:oval");
    } else {
        circle = document.createElement("v:Rect");
    }
    circle.style.left = x - r;
    circle.style.top = y - r;
    circle.style.zIndex = 5;
    circle.style.width = r * 2;
    circle.style.height = r * 2;
    circle.style.cursor = "pointer";
    circle.FillColor = pipeLineObj.fillcolor;
    circle.Stroked = "t";
    circle.onmouseenter = function () {
        var divStr = '<table align="right">';
        divStr += '<tr class="colClass1"><td class="rightTd">数据类型：</td><td>' + pipeLineObj.dataType + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">编号：</td><td id="id">' + pipeLineObj.ID + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">规格：</td><td>' + pipeLineObj.specification + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">材质：</td><td>' + pipeLineObj.mater + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">横坐标：</td><td>' + pipeLineObj.endCoordX + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">纵坐标：</td><td>' + pipeLineObj.endCoordY + '</td></tr>';
        divStr += '<tr class="colClass1"><td class="rightTd">管线高程：</td><td>' + pipeLineObj.dxPipeLineEndAlt + '</td></tr>';
        divStr += '<tr class="colClass2"><td class="rightTd">地面高程：</td><td>' + pipeLineObj.dataEndAlt + '</td></tr>';
        divStr += '</table>';
        $("#divHover").html(divStr);
        $("#divHover").show();

        if ($(this).offset().left + 15 + $("#divHover").width() > 1000 + 60) {
            $("#divHover").css("left", $(this).offset().left - 5 - $("#divHover").width());
        } else {
            $("#divHover").css("left", $(this).offset().left + 15);
        }
        if ($(this).offset().top + 15 + $("#divHover").height() > 600 + 100) {
            $("#divHover").css("top", $(this).offset().top - 5 - $("#divHover").height());
        } else {
            $("#divHover").css("top", $(this).offset().top + 15);
        }
    };
    circle.onmouseout = function () {
        $("#divHover").hide();
    }
    circle.onclick = function () {
        circle.Stroked = "f";
        var x = event.screenX - 100;
        var y = event.screenY - 250;
        newWin = window.showModalDialog("MessageBox.html?t=" + pipeLineObj.dataType + "&i=" + pipeLineObj.ID + "&s=" + pipeLineObj.specification + "&m=" + pipeLineObj.mater +
            "&x=" + pipeLineObj.endCoordX + "&y=" + pipeLineObj.endCoordY + "&p=" + pipeLineObj.dxPipeLineEndAlt + "&g=" + pipeLineObj.dataEndAlt
            , "_blank", "dialogWidth=220px;dialogHeight=220px,top=" + y + ",left=" + x + ",toolbar=no,menubar=no,scrollbars=no, resizable=no,location=no,status=no");
    };
    gCanvas.appendChild(circle);

    var plotLine = document.createElement("v:line");
    plotLine.style.zIndex = 4;
    plotLine.Stroked = "true";
    plotLine.StrokeWeight = 1;
    var stroke = document.createElement("v:stroke");
    stroke.DashStyle = "dash";
    plotLine.appendChild(stroke);
    plotLine.From = x + "," + y;
    plotLine.To = "0" + "," + y;
    gCanvas.appendChild(plotLine);

    insertEndDataToTable(pipeLineObj, y, yy);
}
//向表格中插入数据
var yyy = 0;
function insertStartDataToTable(pipeLineObj, y, yy) {
    var groundAlt = pipeLineObj.groundStartAlt;
    var newShape = document.createElement("<v:shape style='position:absolute;left:160;top:" + (y - 20) + ";WIDTH:72px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty0' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3); '></v:textbox>");
    newShape.insertBefore(newText);
    newText.innerHTML = pipeLineObj.dataStartAlt;

    var pipeLineAlt = pipeLineObj.dxPipeLineStartAlt;
    var newShape = document.createElement("<v:shape style='position:absolute;left:120;top:" + (y - 20) + ";WIDTH:72px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty1' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
    newShape.insertBefore(newText);
    newText.innerHTML = pipeLineAlt;


    var newShape = document.createElement("<v:shape style='position:absolute;left:80;top:" + (yy - 20) + ";WIDTH:78px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty2' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;'></v:textbox>");
    newShape.insertBefore(newText);

    var specification = pipeLineObj.specification;
    specification = specification.toString();
    if (specification.indexOf("X") == -1) {
        var newShape = document.createElement("<v:shape style='position:absolute;left:40;top:" + (y - 20) + ";WIDTH:78px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
        gCanvas.insertBefore(newShape);
        var newText = document.createElement("<v:textbox id='ty3' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
        newShape.insertBefore(newText);
        newText.innerHTML = specification;

    } else if (specification.indexOf("X") > -1) {
        var newShape = document.createElement("<v:shape style='position:absolute;left:30;top:" + (y - 25) + ";WIDTH:40px;HEIGHT:100px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
        gCanvas.insertBefore(newShape);
        var newText = document.createElement("<v:textbox id='ty3' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;'></v:textbox>");
        newShape.insertBefore(newText);
        newText.innerHTML = specification;
    }
    var deep = pipeLineObj.startDeep;
    var newShape = document.createElement("<v:shape style='position:absolute;left:0;top:" + (y - 20) + ";WIDTH:78px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty4' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
    newShape.insertBefore(newText);
    newText.innerHTML = deep;
}
var bLastPoint = 0;
//向表格中插入数据
function insertEndDataToTable(pipeLineObj, y, yy) {
    var length = (pipeLineObj.length).toFixed(2);
    var newShape = document.createElement("<v:shape style='position:absolute;left:30;top:" + (yy + yyy) / 2 + ";WIDTH:78px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty2' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;'></v:textbox>");
    newShape.insertBefore(newText);
    newText.innerHTML = length;

    if (bLastPoint == 0) {
        return;
    }

    //地面高程
    var groundAlt = pipeLineObj.groundEndAlt;
    var newShape = document.createElement("<v:shape style='position:absolute;left:160;top:" + (y - 20) + ";WIDTH:72px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty0' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3); '></v:textbox>");
    newShape.insertBefore(newText);
    newText.textContent = pipeLineObj.dataEndAlt;

    var pipeLineAlt = pipeLineObj.dxPipeLineEndAlt;
    var newShape = document.createElement("<v:shape style='position:absolute;left:120;top:" + (y - 20) + ";WIDTH:72px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty1' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
    newShape.insertBefore(newText);
    newText.innerHTML = pipeLineAlt;

    yyy = yy;

    var specification = pipeLineObj.specification;
    specification = specification.toString();
    if (specification.indexOf("X") == -1) {
        var newShape = document.createElement("<v:shape style='position:absolute;left:40;top:" + (y - 20) + ";WIDTH:78px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
        gCanvas.insertBefore(newShape);
        var newText = document.createElement("<v:textbox id='ty3' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
        newShape.insertBefore(newText);
        newText.innerHTML = specification;

    } else if (specification.indexOf("X") > -1) {
        var newShape = document.createElement("<v:shape style='position:absolute;left:30;top:" + (y - 25) + ";WIDTH:40px;HEIGHT:100px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
        gCanvas.insertBefore(newShape);
        var newText = document.createElement("<v:textbox id='ty3' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;'></v:textbox>");
        newShape.insertBefore(newText);
        newText.innerHTML = specification;
    }
    var deep = pipeLineObj.endDeep;
    var newShape = document.createElement("<v:shape style='position:absolute;left:0;top:" + (y - 20) + ";WIDTH:78px;HEIGHT:70px;z-index:8' coordsize='1000,600' fillcolor='white'></v:shape>");
    gCanvas.insertBefore(newShape);
    var newText = document.createElement("<v:textbox id='ty4' inset='3pt,0pt,3pt,0pt' style='font-size:8pt;v-text-anchor:bottom-right-baseline;filter: progid:DXImageTransform.Microsoft.BasicImage(rotation=3);'></v:textbox>");
    newShape.insertBefore(newText);
    newText.innerHTML = deep;
}
//创建所有管线剖面
function createPipeProfiles(pipeLineObjList, minX, maxX, minY, maxY) {
    var i = 0;
    var x = 0;
    var y = 0;
    var yy = 0;
    var tempStart = 0;
    var tempEnd = 0;
    while (i < pipeLineObjList.length) {
        var specification = 0;
        if ("" != pipeLineObjList[i].specification && pipeLineObjList[i].specification.toString().indexOf("X") < 0) {
            specification = pipeLineObjList[i].specification / 1000;   //管径
        }
        if (pipeLineObjList[i].flow) {
            if (params.profileAlt == "0") {
                tempStart = pipeLineObjList[i].pipeLineStartAlt;
                tempEnd = pipeLineObjList[i].pipeLineEndAlt;
            }
            else {
                tempStart = pipeLineObjList[i].groundStartAlt - pipeLineObjList[i].startDeep;
                tempEnd = pipeLineObjList[i].groundEndAlt - pipeLineObjList[i].endDeep;
            }
        } else {
            if (params.profileAlt == "0") {
                tempEnd = pipeLineObjList[i].pipeLineStartAlt;
                tempStart = pipeLineObjList[i].pipeLineEndAlt;
            }
            else {
                tempEnd = pipeLineObjList[i].groundStartAlt - pipeLineObjList[i].startDeep;
                tempStart = pipeLineObjList[i].groundEndAlt - pipeLineObjList[i].endDeep;
            }
        }
        if ((maxX - minX) != 0) {
            ratioX = 200 / (maxX - minX);
            x = (tempStart - minX) * ratioX + 250;
        } else {
            x = tempStart - minX + 250;
        }
        if (x > 450) {
            x = 450;
        } else if (x < 250) {
            x = 250;
        }
        if ((maxY - minY) != 0) {
            ratioY = 800 / (maxY - minY);
            y = (pipeLineObjList[i].width - minY) * ratioY + 150;
            if (y > 950) {
                y = 950;
            } else if (y < 150) {
                y = 150;
            }
            yy = (pipeLineObjList[i].width - minY) * ratioY + 150;
            if (yy > 950) {
                yy = 950;
            } else if (yy < 150) {
                yy = 150;
            }
        } else {
            y = pipeLineObjList[i].width - minY + 150;
            if (y > 950) {
                y = 950;
            } else if (y < 150) {
                y = 150;
            }
            yy = pipeLineObjList[i].width - minY + 150;
            if (yy > 950) {
                yy = 950;
            } else if (yy < 150) {
                yy = 150;
            }
        }
        var lineType = "circle";
        var tag = pipeLineObjList[i].specification;
        if (isNaN(pipeLineObjList[i].specification)) {
            lineType = "polygon";
        } else {
            lineType = "circle";
        }
        createPipeStartProfile(pipeLineObjList[i], x, y, yy, lineType);
        if ((maxX - minX) != 0) {
            ratioX = 200 / (maxX - minX);
            x = (tempEnd - minX) * ratioX + 250;
        } else {
            x = tempEnd - minX + 250;
        }
        if (x > 450) {
            x = 450;
        } else if (x < 250) {
            x = 250;
        }
        if ((maxY - minY) != 0) {
            ratioY = 800 / (maxY - minY);
            y = (pipeLineObjList[i].width + pipeLineObjList[i].length - minY) * ratioY + 150;
            if (y > 950) {
                y = 950;
            } else if (y < 150) {
                y = 150;
            }
            yy = (pipeLineObjList[i].width + pipeLineObjList[i].length - minY) * ratioY + 150;
            if (yy > 950) {
                yy = 950;
            } else if (yy < 150) {
                yy = 150;
            }
        } else {
            y = pipeLineObjList[i].width + pipeLineObjList[i].length - minY + 150;
            if (y > 950) {
                y = 950;
            } else if (y < 150) {
                y = 150;
            }
            yy = pipeLineObjList[i].width + pipeLineObjList[i].length - minY + 150;
            if (yy > 950) {
                yy = 950;
            } else if (yy < 150) {
                yy = 150;
            }
        }
        if (i == pipeLineObjList.length - 1) {
            bLastPoint = 1;
        }
        createPipeEndProfile(pipeLineObjList[i], x, y, yy, lineType);
        i += 1;
    }
}
// 地形剖面线
function createTerrainProfile(pts) {
    var tempPts = pts.toString().split(",");
    for (var i = 0; i < tempPts.length; i++) {
        if (i == 0) {
            pts = tempPts[i];
        }
        else {
            pts += "," + tempPts[i];
        }
    }
    var line = document.createElement("v:polyline");
    line.style.zIndex = 4;
    line.StrokeWeight = 1;
    line.points = pts.toString();
    gCanvas.appendChild(line);
}
// 管线剖面线
function createPipeLineProfile(pipeLineCoordList, pipeLineObjList) {
    var j = 0;
    for (var i = j; i < pipeLineCoordList.length; i += 4) {
        var p1 = (parseFloat(pipeLineCoordList[i].toString()) + 5).toString();
        var p2 = pipeLineCoordList[i + 1].toString();
        var p3 = (parseFloat(pipeLineCoordList[i + 2].toString()) + 5).toString();
        var p4 = pipeLineCoordList[i + 3].toString();
        createPipeLineProfileTemp(p1, p2, p3, p4, pipeLineObjList[j]);//创建管线切面
        j = j + 1;
    }
}
function createPipeLineProfileTemp(p1, p2, p3, p4, pipeLineObj) {
    var line = document.createElement("v:polyline");//创建线
    line.stroked = "true";
    line.StrokeWeight = 1;
    line.strokecolor = pipeLineObj.fillcolor;
    line.style.zIndex = 4;
    line.onclick = function () {//谈出线
        var x = event.screenX - 80;
        var y = event.screenY - 150;
        newWin = window.showModalDialog("MessageBox1.html?t=" + pipeLineObj.dataType + "&i=" + pipeLineObj.ID + "&m=" + pipeLineObj.mater + "&s=" + pipeLineObj.specification,
            "_blank", "dialogHeight=110px;dialogWidth=200px,top=" + y + ",left=" + x + ",toolbar=no,menubar=no,scrollbars=yes, resizable=yes,location=no,status=no");
    };
    line.points = p1 + "," + p2 + "," + p3 + "," + p4;
    gCanvas.appendChild(line);
}
createYLine();
createYTick();
createTableTitle();
var params;
$(function () {
    params = window.dialogArguments;
    var pipeLineObjList = params.pipeLineObjList;
    var groundAltList = params.gAltList;
    var pipeLineAltList = params.pAltList;
    var minGroundAltitude = params.minG;
    var maxGroundAltitude = params.maxG;
    var minPipeLineAltitude = params.minP;
    var maxPipeLineAltitude = params.maxP;
    var minX = Math.min(minPipeLineAltitude, minGroundAltitude);
    var maxX = Math.max(maxPipeLineAltitude, maxGroundAltitude);
    var minY = 0;
    var maxY = pipeLineAltList[pipeLineAltList.length - 1];
    var temp = null;
    var ratioX = null;
    var ratioY = null;
    //将坐标变换
    var convertCoordList = function (altitudeList) {
        var coordList = [];
        for (var i = 0; i < altitudeList.length; i++) {
            if ((maxX - minX) != 0) {
                ratioX = 200 / (maxX - minX);
                temp = ratioX * (altitudeList[i] - minX) + 250;
            } else {
                temp = altitudeList[i] + 250;
            }
            if (temp > 450) {
                temp = 450;
            } else if (temp < 250) {
                temp = 250;
            }
            coordList.push(temp);
            i++;
            if ((maxY - minY) != 0) {
                ratioY = 800 / (maxY - minY);
                temp = ratioY * (altitudeList[i] - minY) + 150;
            } else {
                temp = altitudeList[i] + 150;
            }
            if (temp > 950) {
                temp = 950;
            } else if (temp < 150) {
                temp = 150;
            }
            coordList.push(temp);
        }
        return coordList;
    };
    var groundCoordList = convertCoordList(groundAltList);
    var pipeLineCoordList = convertCoordList(pipeLineAltList);
    createPipeProfiles(pipeLineObjList, minX, maxX, minY, maxY);
    createTerrainProfile(groundCoordList);//创建地面切面
    createPipeLineProfile(pipeLineCoordList, pipeLineObjList);//创建管线切面
    createYTickValue(maxX, minX);
});