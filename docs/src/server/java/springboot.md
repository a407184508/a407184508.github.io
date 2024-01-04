
# Spring Boot 2.x 集成

## 1. 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

## 2. 编写配置类

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/static/**").addResourceLocations("classpath:/static/");
    }
}
```

## 3. 编写控制器

```java
@Controller
public class HelloController {

    @RequestMapping("/hello")
    public String hello() {
        return "hello";
    }
}
```

## 4. 编写模板

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Hello</title>
</head>
<body>
    <h1 th:text="'Hello World!'"></h1>
</body>
</html>
```

## 5. 启动项目

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```
## 6. 访问

访问 `http://localhost:8080/hello` 即可看到页面。

在Spring Boot中，我们可以使用`@SpringBootApplication`注解来代替`@Configuration`和`@EnableWebMvc`注解。

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

这样，我们就不用再去编写配置类了。

另外，我们也可以使用`@RestController`注解代替`@Controller`。

```java
@RestController
public class HelloController {

    @RequestMapping("/hello")
    public String hello() {
    
    }
}
```

这样，我们就不用再去编写控制器了。

