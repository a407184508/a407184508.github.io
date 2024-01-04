
# 常用 Sql 语句与关键词

一些最重要的 SQL 命令
SELECT - 从数据库中提取数据
UPDATE - 更新数据库中的数据
DELETE - 从数据库中删除数据
INSERT INTO - 向数据库中插入新数据
CREATE DATABASE - 创建新数据库
ALTER DATABASE - 修改数据库
CREATE TABLE - 创建新表
ALTER TABLE - 变更（改变）数据库表
DROP TABLE - 删除表
CREATE INDEX - 创建索引（搜索键）
DROP INDEX - 删除索引
TRUNCATE TABLE - 清空表

# 常用 SQL 语句

## 1. 查询表中的所有数据
SELECT * FROM 表名;

## 2. 查询表中的部分数据
SELECT 字段1, 字段2,... FROM 表名;

## 3. 查询表中的部分数据，并按照指定字段排序
SELECT 字段1, 字段2,... FROM 表名 ORDER BY 字段名;

## 4. 查询表中的部分数据，并按照指定字段排序，并限制返回的数据条数
SELECT 字段1, 字段2,... FROM 表名 ORDER BY zx ASC LIMIT 10;

## 5. 查询表中的部分数据，并按照指定字段排序，并限制返回的数据条数，并跳过前面指定条数的数据
SELECT 字段1, 字段2,... FROM 表名 ORDER BY zx ASC LIMIT 10,20;

## 6. 查询表中的部分数据，并按照指定字段排序，并限制返回的数据条数，并跳过前面指定条数的数据，并只返回指定的字段
SELECT 字段1, 字段2,... FROM 表名 ORDER BY zx ASC LIMIT 10,20;

# 常用 Sql 语句与关键词