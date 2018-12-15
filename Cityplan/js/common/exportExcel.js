/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：导出excel表格
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
function PageToExcel(TableID, FirstRow, LastRowColor, SaveAsName) {
    this.lastRowColor = LastRowColor == "" ? 0 : LastRowColor;
    var today = new Date();
    this.saveAsName = (SaveAsName == "" ? today.getYear() + "年" + (today.getMonth() + 1) + "月" + today.getDate() + "日.xls" : SaveAsName);
    this.tableId = TableID;
    this.table = document.getElementById(this.tableId);//导出的table 对象
    if(this.table.rows(0)==null){
        return;
    }
    this.rows = this.table.rows.length;//导出的table总行数
    this.colSumCols = this.table.rows(0).cells.length;//第一行总列数
    this.fromrow = FirstRow;
    this.beginCol = 0; //起始列数
    this.cols = this.colSumCols;
    this.oXL = null;
    this.oWB = null;
    this.oSheet = null;
    this.rowSpans = 1; //行合并
    this.colSpans = 1; //列合并
    this.colsName = {0: "A", 1: "B", 2: "C", 3: "D", 4: "E", 5: "F", 6: "G", 7: "H", 8: "I", 9: "J", 10: "K", 11: "L", 12: "M", 13: "N", 14: "O", 15: "P", 16: "Q", 16: "R", 18: "S", 19: "T", 20: "U", 21: "V", 22: "W", 23: "X", 24: "Y", 25: "Z"};

}
PageToExcel.prototype.DeleteExcelCols = function (NotShowColList) {//数组NotShowColList
    //删除excel中的列
    var m = 0;
    for (var i = 0; i < NotShowColList.length; i++) {
        if (i > 0) {
            m++;
        }
        var temp = NotShowColList[i] - m;
        var index = this.colsName[temp];
        this.oSheet.Columns(index).Delete;//删除
    }
    m = 0;
}

PageToExcel.prototype.CreateExcel = function (ExcelVisible) {
    try {
        this.oXL = new ActiveXObject("Excel.Application"); //创建应该对象
        this.oXL.Visible = true;
        this.oWB = this.oXL.Workbooks.Add();//新建一个Excel工作簿
        this.oSheet = this.oWB.WorkSheets(1);
    } catch (e) {
        alert("请确认安装了非绿色版本的excel！" + e.description);
        PageToExcel.prototype.CloseExcel();
    }
}

PageToExcel.prototype.CloseExcel = function () {
    if(this.oXL){
        this.oXL.DisplayAlerts = false;
        this.oXL.Quit();
        this.oXL = null;
    }
    if(this.oWB){
        this.oWB = null;
    }
    if(this.oSheet){
        this.oSheet = null;
    }
}

PageToExcel.prototype.ChangeElementToLabel = function (ElementObj) {

    var GetText = "";
    try {
        var childres = ElementObj.childNodes;

    } catch (e) {
        return GetText
    }
    if (childres.length <= 0) return GetText;
    for (var i = 0; i < childres.length; i++) {
        try {
            if (childres[i].style.display == "none" || childres[i].type.toLowerCase() == "hidden") {
                continue;
            }
        }
        catch (e) {
        }

        try {
            switch (childres[i].nodeName.toLowerCase()) {
                case "#text" :
                    GetText += childres[i].nodeValue;
                    break;
                case "br" :
                    GetText += "\n";
                    break;
                case "img" :
                    GetText += "";
                    break;
                case "select" :
                    GetText += childres[i].options[childres[i].selectedIndex].innerText;
                    break;
                case "input" :
                    if (childres[i].type.toLowerCase() == "submit" || childres[i].type.toLowerCase() == "button") {
                        GetText += "";
                    } else if (childres[i].type.toLowerCase() == "textarea") {
                        GetText += childres[i].innerText;
                    } else {
                        GetText += childres[i].value;
                    }
                    break;
                default :
                    GetText += this.ChangeElementToLabel(childres[i]);
                    break;
            }

        } catch (e) {
        }
    }
    return GetText;
}

PageToExcel.prototype.SaveAs = function () {
    //保存
    try {
        this.oXL.Visible = true;
        var fname = this.oXL.Application.GetSaveAsFilename(this.saveAsName, "Excel Spreadsheets (*.xls), *.xls");
        if (fname) {
            this.oWB.SaveAs(fname);
            this.oXL.Visible = true;
        }
    } catch (e) {
    };
}
PageToExcel.prototype.Exec = function () {
    if(!this.rows||!this.cols) return;
    //寻找列数，考虑到第一行可能存在
    for (var i = 0; i < this.colSumCols; i++) {
        var tmpcolspan = this.table.rows(0).cells(i).colSpan;
        if (tmpcolspan > 1) {
            this.cols += tmpcolspan - 1;
        }
    }

    //定义2维容器数据，1：行；2：列；值（0 可以填充，1 已被填充）
    var container = new Array(this.rows);
    for (var i = 0; i < this.rows; i++) {
        container[i] = new Array(this.cols);
        for (j = 0; j < this.cols; j++) {
            container[i][j] = 0;
        }
    }

    if(!this.oSheet){
        return;
    }
    //将所有单元置为文本，避免非数字列被自动变成科学计数法和丢失前缀的0
    this.oSheet.Range(this.oSheet.Cells(this.fromrow + 1, 1), this.oSheet.Cells(this.fromrow + this.rows, this.cols)).NumberFormat = "@";
    // 循环行
    for (i = 0; i < this.rows; i++) {
        //循环列
        for (j = 0; j < this.cols; j++) {
            //寻找开始列
            for (k = j; k < this.cols; k++) {
                if (container[i][k] == 0) {
                    this.beginCol = k;
                    k = this.cols; //退出循环
                }
            }

            //赋值
            //此处相应跟改 根据 标签的类型，替换相关参数
            this.oSheet.Cells(i + 1 + this.fromrow, this.beginCol + 1).value = this.ChangeElementToLabel(this.table.rows(i).cells(j));

            //计算合并列
            try {
                this.colSpans = this.table.rows(i).cells(j).colSpan;
            } catch (e) {
                this.colSpans = 0
            }
            if (this.colSpans > 1) {
                //合并
                this.oSheet.Range(this.oSheet.Cells(i + 1 + this.fromrow, this.beginCol + 1), this.oSheet.Cells(i + 1 + this.fromrow, this.beginCol + this.colSpans)).Merge();
            }
            //将当前table位置填写到对应的容器中
            for (k = 0; k < this.colSpans; k++) {
                container[i][this.beginCol + k] = 1;
            }
            // 计算合并行

            try {
                this.rowSpans = this.table.rows(i).cells(j).rowSpan;
            } catch (e) {
                this.rowSpans = 0;
            }

            if (this.rowSpans > 1) { //行合并
                this.oSheet.Range(this.oSheet.Cells(i + 1 + this.fromrow, this.beginCol + 1), this.oSheet.Cells(i + this.rowSpans + this.fromrow, this.beginCol + this.colSpans)).Merge();
                //将当前table位置填写到对应的容器中
                for (k = 1; k < this.rowSpans; k++) { //由于第0行已经被colSpans对应的代码填充了，故这里从第1行开始
                    for (l = 0; l < this.colSpans; l++) {
                        container[i + k][this.beginCol + l] = 1;
                    }
                }
            }
            //如果开始列＋合并列已经等于列数了，故不需要再循环html table
            if (this.beginCol + this.colSpans >= this.cols) j = this.cols;

        }
    }


    //最后一行是否空色
    try {
        this.oSheet.Range(this.oSheet.Cells(this.rows, 1), this.oSheet.Cells(this.rows, 1)).Font.Color = this.lastRowColor;
    } catch (e) {
    }

    this.oSheet.Range(this.oSheet.Cells(this.fromrow + 2, 1), this.oSheet.Cells(this.fromrow + this.rows, this.cols)).Rows.RowHeight = 20;
    this.oSheet.Range(this.oSheet.Cells(this.fromrow + 2, 1), this.oSheet.Cells(this.fromrow + this.rows, this.cols)).Font.Size = 10;
    //自动换行
    this.oSheet.Range(this.oSheet.Cells(this.fromrow + 2, 1), this.oSheet.Cells(this.fromrow + this.rows, this.cols)).WrapText = true;
    //自动调整列宽
    this.oSheet.Range(this.oSheet.Cells(this.fromrow + 1, 1), this.oSheet.Cells(this.fromrow + this.rows, this.cols)).Columns.AutoFit();
    //点虚线
    
    return this.rows;
}