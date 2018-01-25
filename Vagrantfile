# -*- mode: ruby -*-
# vi: set ft=ruby :

# CONFIGURATION
Box_Ip = "192.168.10.14"
Box_Hostname = "savonsheets.test"
Public_Dir = "public_html" # in same directory as this file
Databases = {"magento" => "magento_seed.sql", "dsx" => ""} # in same directory as this file

PHP_Version = 7 # 5 or 7

VBox_Name = "savonsheets" # Name for this virtual machine
VBox_Memory = 2048
VBox_Cpus = 2

# RECOMMENDED
# Run: vagrant plugin install vagrant-hostsupdater
# Automatically updates your host file for you

# DO NOT MODIFY
Vagrant.configure("2") do |config|
    # Basic Vagrant config
    config.vm.hostname = "#{Box_Hostname}"
    config.vm.box = "scotch/box"
    config.vm.network "private_network", ip: "#{Box_Ip}"
    config.vm.synced_folder ".", "/var/www", :nfs => { :mount_options => ['rw', 'vers=3', 'tcp', 'fsc', 'actimeo=2', 'dmode=777', 'fmode=666'] }

    # Configure virtual machine
    config.vm.provider "virtualbox" do |v|
        v.memory = "#{VBox_Memory}"
        v.cpus = "#{VBox_Cpus}"
        v.name = "#{VBox_Name}"

        # Fix for Scotchbox Pro hanging at boot while it figures out network stuff
        v.customize ["modifyvm", :id, "--cableconnected1", "on"]
    end

    # PHP 5 - Scotchbox 2.5
    if PHP_Version === 5
        # Gotta grab scotchbox 2.5
        config.vm.box_version = "2.5"

    # PHP 7 - Scotchbox Pro
    elsif PHP_Version === 7
        # Grab scotchbox pro
        config.vm.box = "scotch/box-pro"

        # Enable Vagrant Share
        config.vm.network "forwarded_port", guest: 80, host: 8080
    end

    # Build and import our databases at provision
    Databases.each do |db_name, seed|
        config.vm.provision "shell", inline: <<-SHELL
            # Database Setup
            echo "Creating Database #{db_name}";
            mysql -u root -proot -e "create database #{db_name}"
            echo "Done";

            # Database Import
            echo "\n\nChecking for database files at /var/www/#{seed}";
            if [ -f /var/www/#{seed} ]; then
                echo "Database Seed Found.  Importing...";
                mysql -uroot -proot #{db_name} < /var/www/#{seed}
            else
                echo "Database Seed Not Found."
            fi
            echo "Done importing #{db_name}";
        SHELL
    end

    # Run this when provisioned
    config.vm.provision "shell", inline: <<-SHELL
        # Setting login directory
        usermod -m -d /var/www vagrant

        # Composer setup
        echo "Adding composer to path";
        export PATH="~/.composer/vendor/bin:$PATH";
        echo "Done";

        # Apache Config
        echo "Changing apache root directory from /var/www/public to /var/www/#{Public_Dir}";
        sudo sed -i s,/var/www/public,/var/www/#{Public_Dir},g /etc/apache2/sites-available/000-default.conf;
        echo "Done";
    SHELL

    # PHP 5 - Scotchbox 2.5
    if PHP_Version === 5
        # Run this when provisioned
        config.vm.provision "shell", inline: <<-SHELL
            # Config some more Apache stuff
            sudo sed -i s,/var/www/public,/var/www/#{Public_Dir},g /etc/apache2/sites-available/scotchbox.local.conf;
            echo "Done";
        SHELL

        # Run this at every boot
        config.vm.provision "shell", run:'always', inline: <<-SHELL
            # Mailcatcher setup
            echo "Setting up mailcatcher";
            /home/vagrant/.rbenv/shims/mailcatcher --http-ip=0.0.0.0;
            echo "\n ";
            echo "/----------------------------------/";
            echo "  Mailcatcher ready. Access via";
            echo "/----------------------------------/";
            echo "  #{Box_Hostname}:1080";
            echo "\n ";
        SHELL

    # PHP 7 - Scotchbox Pro
    elsif PHP_Version === 7
        # Run this when provisioned
        config.vm.provision "shell", inline: <<-SHELL
            # XDebug Install and Setup
            echo "Installing Xdebug.  CURRENTLY UNTESTED.";
            sudo apt-get install php-xdebug
            sudo sh -c 'echo "xdebug.remote_enable = 1\nxdebug.remote_connect_back = 1" >> /etc/php/7.0/fpm/conf.d/20-xdebug.ini'
            echo "Done";

            # PHP Reboot
            echo "Restarting PHP";
            sudo service php7.0-fpm restart
            echo "Done";
        SHELL
    end

    # Run this when provisioned
    config.vm.provision "shell", inline: <<-SHELL
        # Apache Reboot
        echo "Restarting Apache";
        sudo service apache2 restart;
        echo "Done";
    SHELL

    # Status message
    config.vm.provision "shell", run:'always', inline: <<-SHELL
        echo "/----------------------------------/";
        echo "  Box ready. Access db via ssh tunnel.";
        echo "/----------------------------------/";
        echo "  host: 127.0.0.1\n  username: root\n  password: root\n  database: \n  ssh host: #{Box_Hostname}\n  ssh username: vagrant\n  ssh password: vagrant";
    SHELL
end
