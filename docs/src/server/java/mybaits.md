
<!-- @import:mybatis-puls -->

# 1. 导入依赖

```java
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.TransactionManagementConfigurer;
import org.springframework.transaction.support.TransactionTemplate;
```
# 2. 配置mybatis

```java
@Configuration
@EnableTransactionManagement
public class MybatisConfig implements TransactionManagementConfigurer {

    @Autowired
    private DataSource dataSource;

    @Bean
    public SqlSessionFactory sqlSessionFactoryBean() throws Exception {
        SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
        sqlSessionFactoryBean.setDataSource(dataSource);
        sqlSessionFactoryBean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath:mapper/*.xml"));
        return sqlSessionFactoryBean.getObject();
    }

    @Bean
    public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) throws Exception {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
```

# 3. 定义接口

```java
public interface UserMapper {
    //查询所有用户
    List<User> findAll();

    //根据id查询用户
    User findById(@Param("id") int id);

    //根据id删除用户
    int deleteById(@Param("id") int id);

    //根据id修改用户
    int updateById(@Param("user") User user);

    //添加用户
    int addUser(@Param("user") User user);
}
```

# 4. 定义实体类

```java
public class User {
    private int id;
    private String name;
}
```

# 5. 定义service

```java
@Service
public class UserService {
    @Autowired
    private UserMapper userMapper;

    public List<User> findAll() {
        return userMapper.findAll();
    }

    public User findById(int id) {
        return userMapper.findById(id);
    }

    public int deleteById(int id) {
        return userMapper.deleteById(id);
    }

    public int updateById(User user) {
        return userMapper.updateById(user);
    }

    public int addUser(User user) {
        return userMapper.addUser(user);
    }
}
```

mapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.demo.mapper">
    <select id="findAll" resultType="com.example.demo.entity.User">
        select * from user
    </select>

    <select id="findById" resultType="com.example.demo.entity.User">
        select * from user where id = #{id}
    </select>

    <delete id="deleteById">
        delete from user where id = #{id}
    </delete>

    <update id="updateById">
        update user set name = #{name} where id = #{id}
    </update>

    <insert id="addUser">
        insert into user(name) values(#{name})
    </insert>
</mapper>
```

# 6. 定义controller

```java
@RestController
@RequestMapping("/user")
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/findAll")
    public List<User> findAll() {
    }
}

```