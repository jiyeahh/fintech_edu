from selenium import webdriver
driver = webdriver.Chrome('./chromedriver')
driver.implicitly_wait(3)
driver.get(
    'https://news.naver.com/main/read.nhn?mode=LPOD&mid=sec&oid=030&aid=0002930523'
    )
title = driver.find_element_by_id('articleTitle')
body = driver.find_element_by_id('articleBodyContents')
print(title.text)
print(body.text)