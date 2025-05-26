/**
 * 天机思维模型 - 古典文人雅致风格交互效果
 */

document.addEventListener('DOMContentLoaded', function() {
    // 添加页面淡入效果
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.classList.add('fade-in');
    }
    
    // 添加滚动显示效果
    const scrollElements = document.querySelectorAll('.scroll-fade');
    
    function checkScrollElements() {
        scrollElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                el.classList.add('fade-in');
            }
        });
    }
    
    // 初始检查
    checkScrollElements();
    
    // 滚动时检查
    window.addEventListener('scroll', checkScrollElements);
    
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 水墨风格下拉菜单效果
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('mouseenter', function() {
            this.querySelector('.dropdown-menu').classList.add('ink-dropdown-open');
        });
        
        dropdown.addEventListener('mouseleave', function() {
            this.querySelector('.dropdown-menu').classList.remove('ink-dropdown-open');
        });
    });
});
