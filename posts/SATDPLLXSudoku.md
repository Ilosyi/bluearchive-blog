---
title: 2024秋华中科技大学数据结构课设:基于SAT(DPLL算法)的对角线数独游戏求解程序
date: 2023-12-24
tags: [大二,课设]
head:
  - - meta
    - name: description
      content: vitepress-theme-bluearchive 
  - - meta
    - name: keywords
      content: vitepress theme bluearchive 
---

基于SAT(DPLL算法)的对角线数独游戏求解程序
<font color=Crimson>**待更新**</font><br>
<font color=Crimson>**完整源码将在结课后传到**</font><br>[HUSTCS2024-SAT-DPLL-XSudoku](https://github.com/Ilosyi/HUSTCS2024-SAT-DPLL-XSudoku)
---

[[toc]]

# 1 什么是SAT问题？
## 1.1 SAT问题简介
&emsp;SAT问题即命题逻辑公式的可满足性问题（satisfiability problem），是计算机科学与人工智能基本问题，是一个典型的NP完全问题，可广泛应用于许多实际问题如硬件设计、安全协议验证等，具有重要理论意义与应用价值。SAT问题也是程序设计与竞赛的经典问题。
对于任一布尔变元x，x与其非“¬x”称为**文字(literal)**。对于多个布尔变元，若干个文字的或运算l1∨l2∨…∨lk称为**子句(clause)**。只含一个文字的子句称为**单子句**。不含任何文字的子句称为**空子句**，常用符号□表示。子句所含文字越多，越易满足，空子句不可满足。
 &emsp;SAT问题一般可描述为：给定布尔变元集合{x1, x2, ..., xn}以及相应的子句集合{c1, c2, ..., cm}，对于合取范式（CNF范式）：F = c1∧c2∧...∧cm，判定是**否存在对每个布尔变元的一组真值赋值使F为真**，当为真时（问题是可满足的，SAT），输出对应的变元赋值（一组解）结果。
&emsp;  简单来说，CNF范式包含若干字句，且需要**每个字句都为真**，而字句为真的条件是子句中**存在为真的文字**。
&emsp;一个CNF SAT公式或算例的具体信息通常存储在一个cnf文件中，例如
c    clause length = 3 
c
p cnf 20 91
4 -18 19 0
3 18 -5 0
-5 -8 -15 0
在每个CNF文件的开始，由‘c’开头的是若干注释说明行；‘p’开头的行说明公式的总体信息，包括：范式为CNF；公式有20个布尔变元，由1到20的整数表示，91个子句。之后每行对应一个子句，0为结束标记。4表示第4号变元，且为正文字；-5则是5号变元对应对应的负文字，文字之间以空格分隔。注意，这里的数字仅代表布尔变元编号，而不是其值。
&emsp;一个CNF公式也可以表示成子句集合的形式：S = {c1, c2, ..., cm}.
例如，由三个布尔变元a, b, c所形成的一个CNF公式（¬a∨b）∧（¬b∨c）,可用集合表示为{¬a∨b, ¬b∨c}，该公式是满足的，a=0, b=0,c=1是其一组解。
## 1.2 数据结构设置
不难想到，一个CNF范式可以由一个二维数组表示，二维数组的每一行表示一个字句，由于无法知道每个字句包含的文字数量，故采用vector容器
然后lz写完后发现课设要求“数据结构不要使用C++现有的vector等类库”，那么首先先自己写（ai写）一个vector类吧
### 1.2.1 vector类

```c++
#include <algorithm> // for std::copy
#include <stdexcept> // for std::out_of_range

template <class T>
class vector {
public:
    // 数据
    T* data;
    // 大小
    int Size;
    // 容量
    int capacity;

    // 构造函数
    vector();

    // 析构函数
    ~vector();
	//含参构造函数(初始化大小,元素)
	vector(int n, T t) ;
    // 拷贝构造函数
    vector(const vector& v) ;

    // 赋值运算符
    vector& operator=(const vector& v);

    // 添加元素
    void push_back(T t);

    // 删除元素
	void pop_back(); // 删除最后一个元素
    
    // 返回大小
    int size() const;

    // 返回元素（非 const 版本）
    T& operator[](int index);

    // 返回元素（const 版本）
    const T& operator[](int index) const;

    //判断是否为空
	bool empty();

    //清空
	void clear();
    // 调整容量
    void resize(int new_capacity);
     // 迭代器类
 class iterator {
};
     // 常量迭代器类
    class const_iterator {
};
}
```
## 1.2.2 Literal类
~~其实这个类没什么必要~~，但是为了整齐还是写了，~~实际上成员函数都没什么用~~
```c++
class Literal
{
public:
	//布尔变量
	int var;
	Literal();
	//构造函数
	Literal(int var);
	//析构函数
	~Literal();
	//是否是负文字
	bool isNegative();
	//返回绝对值
	int getAbs();
	//打印文字
	void print();
	//不等号重载
	bool operator!=(const Literal& l)const;
	//等号重载
	bool operator==(const Literal& l)const;
};
```
## 1.2.3 Clause类
字句由若干文字组成，根据后续DPLL算法的思想（单子句和分裂策略），设置了如下成员函数
```c++
class Clause
{
public:
	//文字集合
	vector<Literal> literals;
	//构造函数
	Clause();
	//析构函数
	~Clause();
	//添加文字
	void addLiteral(Literal l);
	//删除所有特定文字
	void removeLiteral(const Literal& l);
	//打印子句
	void print();
	//判断是否是单子句
	bool isUnit()const;

};
```
## 1.2.4 CNF类
一个CNF公式可以表示成子句集合的形式,根据DPLL思想，设置如下成员函数
```c++
class CNF
{
public:
	//子句集合
	vector<Clause> clauses;
	//构造函数
	CNF();
	//添加子句
	void addClause(Clause c);
	//移除所有包含单子句L的子句
	void removeClause(const Clause& clause);
	//移除剩下所有子句中的~L
	void removeLiteral(const Literal& L);
	bool isEmpty() const {
		return clauses.empty();
	}
	bool hasNext() const {
		// 如果列表中至少有一个子句，且不是空子句，则返回true
		return !clauses.empty() && !clauses[0].literals.empty();
	}
	void print();
};
```
# 2 什么是DPLL算法？
DPLL算法是基于树/二叉树的回溯搜索算法，主要使用两种基本处理策略：
## 2.1 单子句规则
单子句规则。如果子句集S中有一个单子句L,那么L一定取真值，于是可以从S中删除所有包含L的子句（包括单子句本身），得到子句集S1，如果它是空集，则S可满足。否则对S1中的每个子句，如果它包含文字¬L(因为它为假）,则从该子句中去掉这个文字，这样可得到子句集合S2。S可满足当且仅当S2可满足。单子句传播策略就是反复利用单子句规则化简S的过程。
<font color=Blue>**即去掉包含L的字句，并去掉剩下子句中的¬L文字**</font>
故在DPLL函数中，可优先寻找单子句进行传播
```c++
 while (true) {
        bool unitClauseFound = false;
        for (int i = 0; i < cnf.clauses.size(); ++i) {
            const Clause& clause = cnf.clauses[i];
            if (clause.isUnit()) {
                //如果是单子句，传播
                Literal unitLiteral = clause.literals[0];//取出单子句的文字
                if (!propagate(cnf, unitLiteral, assignments)) {
                    return false;//如果传播失败，返回false
                }
              
                unitClauseFound = true;

                break;
            }
        }
```
## 2.2 分裂策略
### 2.2.1 分裂策略概念
按**某种策略**选取一个文字L.如果L取真值，则根据单子句传播策略，可将S化成S2；若L取假值（即¬L成立）时，S可化成S1.
交错使用上述两种策略可不断地对公式化简，并最终达到终止状态，其执行过程可表示为一棵二叉搜索树,如下图所示。
![](https://img2024.cnblogs.com/blog/3507821/202409/3507821-20240907114939000-758044065.png#pic_center =200x300)
基于单子句传播与分裂策略的DPLL算法可以描述为一个如后所示的递归过程DPLL( S ), DPLL算法也可用非递归实现。
```c++
DPLL( S) :
/* S为公式对应的子句集。若其满足，返回TURE；否则返回FALSE. */
{
while(S中存在单子句) {//单子句传播
在S中选一个单子句L；
依据单子句规则，利用L化简S；
if S = Φ return(TRUE);
else if (S中有空子句 ) return（FALSE）；
}//while
基于某种策略选取变元v；         //策略对DPLL性能影响很大
if DPLL（S ∪v ）return(TURE);  //在第一分支中搜索
return DPLL(S ∪¬v);//回溯到对v执行分支策略的初态进入另一分支
}
```
### 2.2.2 分裂（传播）函数
这里的assignments是用来记录赋值状态(由于课程要求将可满足时的结果保存到.res文件中），后续会谈到
```c++
bool propagate(CNF& cnf, const Literal& literal,int *assignments) 
{
    //待更新
```
## 2.3 读取cnf文件
课设要求读取cnf算例文件，解析文件，基于一定的物理结构，建立公式的内部表示；并实现对解析正确性的验证功能，即遍历内部结构逐行输出与显示每个子句，与输入算例对比可人工判断解析功能的正确性。
cnf文件的格式示例请见上文
### 2.3.1 打开文件
这里用C++实现，同时，因为程序可能需要反复读入不同的cnf文件，这里对CNF进行清空操作
```c++
        ifstream file(filename);
        std::string line;

		if (!file.is_open())//打开文件失败
        {
			cerr << "打开文件: " << filename <<"失败"<< endl;//输出错误信息
            return false;
        }
   //调试     else
   //     {
			//printf("File opened successfully\n");//打开文件成功
   //     }
        if (!cnf.isEmpty())//如果CNF不为空
        {
			cnf.clauses.clear();//清空CNF
        }
```
### 2.3.2 读取内容
#### 2.3.2.1 getline函数
```
//定义
_EXPORT_STD template <class _Elem, class _Traits, class _Alloc>
basic_istream<_Elem, _Traits>& getline(
    basic_istream<_Elem, _Traits>& _Istr, basic_string<_Elem, _Traits, _Alloc>& _Str) {
    // get characters into string, discard newline
    return _STD getline(_STD move(_Istr), _Str, _Istr.widen('\n'));
}
```
##### 函数语法结构：
在< string >中的getline函数有四种重载形式：
```
1 istream& getline (istream&  is, string& str, char delim);
2 istream& getline (istream&& is, string& str, char delim);
3 istream& getline (istream&  is, string& str);
4 istream& getline (istream&& is, string& str);
```
##### 函数的变量：
```
is ：表示一个输入流，例如 cin。
str ：string类型的引用，用来存储输入流中的流信息。
delim ：char类型的变量，所设置的截断字符；在不自定义设置的情况下，遇到’\n’，则终止输入
```
该部分转载自CSDN博主Faith_xzc[原文链接](https://blog.csdn.net/weixin_44480968/article/details/104282535)
#### 2.3.2.2 istringstream类
注意包含头文件 #include <sstream>
 ```
//定义
_EXPORT_STD using istringstream = basic_istringstream<char, char_traits<char>, allocator<char>>;
```
istringstream 是 basic_istringstream 的一个特化版本，针对 char 类型的字符，使用标准的字符特征类和分配器类。这样可以确保 istringstream 适合处理标准的 char 类型的字符串。

在C++中，std::istringstream 是 std::basic_istringstream 的一个具体实例，用于从字符串中提取数据。基于流提取操作符 >>，它能够从 istringstream 对象中逐个提取数据并赋值给相应的变量。

因此，实现代码如下（这里仅展示读取第一行）,注意到首行的p cnf是我们不需要的数据，因此设置一个临时string format将它们读取掉
```c++
	while (std::getline(file, line)) // 逐行读取文件
        {
			//cout << line << endl;
            istringstream iss(line);
			
            if (line[0] == 'c' || line.empty()) {
                continue; // 忽略注释和空行
            }

            if (line[0] == 'p') {
				string format;//读取掉p cnf
				iss >> format >> format >> NumVars >> NumClauses;//读取变量数和子句
                //调试 cout << numVars << " " << numClauses << endl; 
            }
            else{  
                     //  读取字句   
            }
}
```
配合getline函数，还可以实现多样的分割操作，详情请见[使用 istringstream 根据分隔符来分割字符串](https://www.cnblogs.com/flix/p/13594908.html)
## 2.4 DPLL具体实现
### 2.4.1 传播函数
```c++
/***********************************************
*函数名称：propagate
* 函数功能：根据给定的文字（literal）对 CNF 公式进行传播，更新 CNF 公式和赋值数组。
* 注释：- 遍历 CNF 公式中的所有子句。
        - 检查子句是否已被给定文字（literal）满足。
        - 如果子句已被满足，则忽略该子句。
        - 如果子句未被满足，删除子句中与给定文字相反的文字。
        - 如果删除文字后子句为空，则返回 False，表示冲突。
        - 如果子句非空，将其添加到新的 CNF 公式中。
        - 更新赋值数组以记录文字的赋值。
* 返回值：bool 类型，如果传播成功，则返回 True，若出现空子句，则返回 False。
************************************************/
bool propagate(CNF& cnf, const Literal& literal,int *assignments) {
    //待更新
}
```
### 2.4.2 选择策略
以下列出的是一些简单的决策方法
更多决策策略可见[基于DPLL的SAT算法的研究及应用](https://kns.cnki.net/kcms2/article/abstract?v=-4s28oSk47_7eHMwEzm3L8wfX3yKJX2gpjM6Khfd95jZpfW4bD_3CKKNHdkeABT0ZVjnYLuS17REiQgkvzDDCUBKDQVsH4td9hm_vbf0C3SRpDUC9GB02ov41G7vHwzswscE7JbcGax2MCRZB2LkRbqFr7bj1jgqH9FqN8p4ESXZmNtEQfxcywZze5IIfniJCFMdSXUX3TssrqypXTxnlGwMmKYZYXCt8noUgbAKI0UPykj-j7zDUA==&uniplatform=NZKPT&language=CHS)
#### 2.4.2.1 选择第一个文字
```c++
   if (way == 2) 
   {
       if (!cnf.clauses.empty() && !cnf.clauses[0].literals.empty()) //如果子句不为空
       {
           return cnf.clauses[0].literals[0];
       }
   }
```
#### 2.4.2.2 随机选取文字
先随机找一个非空子句，再随机找一个文字
虽然在大部分情况下效率低下，但也有小概率随机到有价值的决策变量（~~其实就是想水一个策略出来~~）
```c++
 else if (way == 1)
 {
        
     // 找到一个非空子句
     int clauseIndex = rand() % cnf.clauses.size();
     while (cnf.clauses[clauseIndex].literals.empty()) {
         clauseIndex = rand() % cnf.clauses.size();
     }

     // 选择子句中的一个文字
     int literalIndex = rand() % cnf.clauses[clauseIndex].literals.size();
     return cnf.clauses[clauseIndex].literals[literalIndex];
 }
```
#### 2.4.2.3 选择出现最多的文字

#### 2.4.2.4 选择短子句中出现最多的文字

### 2.4.3 DPLL函数
```c++
/***********************************************
*函数名称：DPLL
* 函数功能：使用 DPLL 算法对给定的 CNF 公式进行求解。
* 注释：- 不断查找单子句，并进行传播。
        - 如果找到单子句且传播成功，则继续处理。
        - 如果 CNF 公式为空，说明所有子句都满足，返回 True。
        - 否则，选择一个文字进行分支搜索。
        - 尝试给文字赋值为真或假，并递归地调用 DPLL 函数。
        - 如果任一分支成功，则返回 True；否则，返回 False。
* 返回值：bool 类型，如果 CNF 公式可满足，则返回 True，否则返回 False。
************************************************/
 bool DPLL(CNF& cnf,int way, int* assignments) {
//待更新
}
```
### 2.4.4 打印赋值结果并保存至同名.res文件
#### 2.4.4.1 打印赋值结果
从前面的代码可以看出，assignments[i]的值为1，表示布尔变元1为真，否则(assignments[i]的值为-1，当然你也可以设置为0，以bool的类型存储数据）其负文字为真
```c++
 void printAssignments(const int* assignments) {
     for (int i = 1; i <= numVars; ++i) {
         if (assignments[i] == 1) {
             std::cout << i << " ";
         }
         else if (assignments[i] == -1) {
             std::cout << -i << " ";
         }
     }
     std::cout << std::endl;
 }
```
#### 2.4.4.2 保存到res文件
**输出文件规范**

---对每个算例的求解结果要求输出到一个与算例同名的文件（文件扩展名为.res），文件内容与格式要求如下：
---s 求解结果//1表示满足，0表示不满足，-1表示在限定时间内未完成求解
---v  -1 2 -3 … //满足时，每个变元的赋值序列，-1表示第一个变元1取假，2表示第二个变元取真，用空格分开，此处为示例。
---t  17     //以毫秒为单位的DPLL执行时间，可增加分支规则执行次数信息

这里咱没有写超时（输出-1）的处理，有大佬愿意可以补充下~~
```c++
void saveResultToFile(const std::string& baseFilename, bool result, const int* assignments,double duration)
{
//待更新
}
```
# 3 数独游戏
## 3.1 数独游戏格局的生成与归约
&emsp;普通数独游戏要求在9×9的网格中每个单元（cell）填入1至9的一个数字，必须满足三种约束：每一行、每一列及9个3×3的盒子中的数字都不重复。
&emsp;一个数独游戏初始时已经提供了一些提示数，要求在剩下的空格中填满数字。初始游戏格局要求只有唯一解（一般至少要有17个提示数），基于推理可以求解。如何生成一个有效的数独游戏格局？一种方案可以从互联网或数独文件读取不少于50个不同的初始合法格局（此生成设计计分评定为良）；另一种方案是设计一种算法自动生成（此生成设计计分评定为优），一般可采用从完整合法填充开始，基于挖洞法生成。
&emsp;对角线数独游戏[12-13]是一种变型的数独，即在上述普通数独的基础上又增加了一类约束：**对角线约束**，如图2.4所示。对角线约束要求在两条对角线（撇对角线与捺对角线）上的数字也不能重复。
![](https://img2024.cnblogs.com/blog/3507821/202409/3507821-20240909181340373-2049152185.png#pic_center =480x240)
## 3.2 自动生成数独棋盘
### 3.2.1 生成完整数独棋盘
参考自[DPLL算法求解CNF-SAT与数独求解程序](https://blog.csdn.net/M1170780140/article/details/128053901)
以及  [随机数独局面生成](https://blog.csdn.net/nibiewuxuanze/article/details/47679927)

采用了类似八皇后问题的**递归回溯**思想，即根据目前的状态，放置一个数，如果递归后返回false，则进行回溯。
如果从空棋盘开始遍历，该算法会永远将第一行填成123456789，因此我们需要先随机生成第一行（当然你也可你考虑其它方案），
再根据第一行的情况求解整个棋盘
### 3.2.2 挖洞法生成游戏棋盘
以下内容来源于~~ChatGPT-4o-mini~~
```c++
int generateGameBoard(const vector<int>& normalBoard, vector<int>& gameBoard) {
	
    // 随机挖去的数字数量
    int numToRemove = 35 + rand() % 13;

    // 复制 normalBoard 到 gameBoard
    gameBoard = normalBoard;

    // 创建索引数组
    vector<int> indices(81,0);
    for (int i = 0; i <81; ++i) {
        indices[i] = i;
    }
   
    // 打乱索引数组
    shuffleArray(indices);

    // 挖去数字
    for (int i = 0; i < numToRemove; ++i) {
        gameBoard[indices[i]] = 0; // 0 表示空白
    }
    return numToRemove;
}
```
### 3.3 转化为SAT问题
#### 3.3.1 转化方案
本课程设计要求利用DPLL SAT求解算法对对角线数独游戏进行求解，因此首先必须理解如何将普通数独游戏转化（归约）为SAT问题，并把它表示为CNF公式的形式。这里要考虑三个问题：
（1）如何定义问题的BOOL变元？
（2）如何用CNF的子句集表示数独游戏的三种约束？
（3）如何表示游戏格局中的提示数条件？下面分别给出一种方案供参考。
变元可按语义编码为1～9之间数字构成的三位整数ijk，i, j, k∈{1,2,…,9}，其中i表示单元格的行号，j表示单元格的列号，k表示单元格<i, j>填入的数字为k。如163变元表示第1行6列填入3；负文字 -452表示第4行5列不填入2。这样编码共有729个变元。
数独游戏的基本要求是：每个单元格只能填入1～9之间唯一一个数字，称之为“格约束”。以单元格<1,1>例，这可以表示为如下子句：

111 112 113 114 115 116 117 118 119 0 //单元格（1，1）必须填入1-9中的一个数
-111 -112 0
-111 -113 0
……
-118 -119 0//不能重复，这里共有（1+2+……+8)个子句
121 122 123 124 …… ////单元格（1，2）必须填入1-9中的一个数

上述表示中，每个子句的末尾的0表示结束标记；第一个子句的含义是单元格<1,1>可填入至少一个数字；后面的子句集共同表示只能填入一个数字，子句-111 -112 0表示不能同时填1与2；其它类推。按这种方式需要对81个单元格进行类似表示，得到对应的子句集。
行约束要求每行需要填入1～9中的每个数字，且每个数字只出现一次。以第1行为例可表示为（此处在每个子句后加入注释，说明子句的含义）：
111 121 131 141 151 161 171 181 191 0     第1行含有1
112 122 132 142 152 162 172 182 192 0     第1行含有2
… …
119 129 139 149 159 169 179 189 199 0     第1行含有9
-111 -121 0             前两格不同时为1
-111 -131 0             第1与第3格不同时为1
… …
-111 -191 0             第1与第9格不同时为1
… …
列约束仿照行约束易于表示为对应子句集，同学们可自行写出。
对于3×3的盒子约束，以左上角的盒子为例进行说明，其子句集可表示如下：
111 121 131 211 221 231 311 321 331 0   包含1
112 122 132 212 222 232 312 322 332 0   包含2
     … …
119 129 139 219 229 239 319 329 339 0   包含9
-111 -211 0        11格与21格不同时为1
-111 -311 0        11格与31格不同时为1
-111 -121 0        11格与12格不同时为1
     … …
最后，对于每个具体的数独游戏，已经填入了部分提示数，如图2.3中的左图，每个提示数可表示为一个单子句，如第2行3列填入5，对应单子句如下：
235 0
SAT公式CNF文件中，一般变元是从1进行连续编码的，可以将上述语义编码转换为自然顺序编码，公式为：ijn → (i-1)*81+(j-1)*9+n；当按自然编码对数独游戏对应的CNF公式求解后，可设计逆变换公式将解解析为对应的游戏填充方案，完成填充，或给游戏玩家给予每一步填充的正误提示。
根据上面的分析，数独约束生成CNF子句集易于用**多重循环**结构实现。

#### 3.3.2具体实现
建议直接~~**打表**~~
行列的代码较易写出，以下仅列出对角线部分和九宫格部分的转化代码。
通用的约束子句集请见[github](https://github.com/HJNODM/DPLL-SAT-Solver)，注意删去数独上已有数产生的约束子句）
本项目中将该通用部分放到了资源文件中，后续只需在后追加由数独棋盘上已有数产生的约束条件
```c++
bool XSudokuToCnf(const vector<int>& board, int empty)
{
//待更新
|
```
