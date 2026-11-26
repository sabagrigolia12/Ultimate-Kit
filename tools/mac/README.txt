Ultimate Kit - macOS ინსტალაცია
=================================

Ultimate Kit არის After Effects-ის პლაგინი (After Effects 2024 ან უფრო ახალი).
macOS 26 Tahoe, 15 Sequoia და უფრო ძველი, Apple Silicon და Intel.

რატომ არ იხსნებოდა ძველი ინსტალერი
-------------------------------------
macOS ბლოკავს ინტერნეტიდან ჩამოტვირთულ ყველა აპს და სკრიპტს, რომელსაც ფასიანი Apple Developer
ხელმოწერა არ აქვს ("Not Opened", "Move to Trash", "is damaged"). ფაილი დაზიანებული არ არის.
ამიტომ ახლა ინსტალაცია Adobe-ის UXP Developer Tool-ით ხდება: მას macOS არ ბლოკავს.


გზა 1: UXP Developer Tool (Terminal-ის გარეშე)
------------------------------------------------
  საჭიროა: Premiere Pro 25.6 ან უფრო ახალი და UXP Developer Tool (Creative Cloud-იდან).
  Premiere აქ მხოლოდ ერთხელ, ინსტალაციისთვის გამოიყენება. პლაგინი თვითონ After Effects-ში იმუშავებს.

  1) გახსენი zip ფაილი (ორჯერ დააკლიკე). გაჩნდება საქაღალდე UltimateKit-mac.
     (თუ ძველი UltimateKit-mac საქაღალდე იქვე უკვე გაქვს, ჯერ ის წაშალე.)
  2) გახსენი Premiere Pro.
  3) გახსენი UXP Developer Tool -> Add Plugin -> აირჩიე ფაილი:
       UltimateKit-mac / Ultimate Kit UDT / manifest.json
  4) სიაში გამოჩნდება "Ultimate Kit Installer" -> Load.
     Premiere-ში გაიხსნება პატარა პანელი "Ultimate Kit Installer".
  5) დააჭირე Install და დაელოდე, სანამ დაწერს "Ultimate Kit დაინსტალირდა!".
  6) თუ პანელი წერს, რომ Mac უნდა გადატვირთო, გადატვირთე ერთხელ (Restart).
     macOS ახალ პარამეტრს მხოლოდ ამის შემდეგ კითხულობს. შემდეგ ინსტალაციაზე ეს აღარ დაგჭირდება.
  7) გახსენი After Effects -> Window -> Extensions -> Ultimate Kit
  8) ერთხელ ჩართე After Effects-ში:
       Settings -> Scripting & Expressions -> "Allow Scripts to Write Files and Access Network"

  ამის შემდეგ "Ultimate Kit Installer"-ის UXP Developer Tool-ში დატოვება აღარ არის საჭირო.
  წაშლა: იგივე პანელში Uninstall.
  განახლება: ახალი zip -> იგივე ნაბიჯები (Add Plugin / Load -> Install).


გზა 2: Terminal (თუ UXP Developer Tool არ გაქვს)
---------------------------------------------------
  a. გახსენი Terminal: Cmd + Space, ჩაწერე Terminal, Enter.
  b. ჩაწერე  bash  და ერთი space. Enter ჯერ არ დააჭირო.
  c. UltimateKit-mac საქაღალდიდან ჩაათრიე ფაილი  Install.command  Terminal-ის ფანჯარაში.
  d. დააჭირე Enter. თუ macOS დაგეკითხება Downloads-ზე წვდომას -> Allow.
  e. გაიხსნება Ultimate Kit-ის ფანჯარა -> Install.
  f. გადატვირთე After Effects -> Window -> Extensions -> Ultimate Kit

  Install.command-ზე ორჯერ დაკლიკება არ იმუშავებს (macOS მას ბლოკავს). მხოლოდ bash-ით გაუშვი.
  თუ საქაღალდე Downloads-შია, b-c-d-ის ნაცვლად ეს ერთი ხაზიც საკმარისია:
    bash ~/Downloads/UltimateKit-mac/Install.command


Mac-ზე რა განსხვავდება
------------------------
  - Text ანიმაციების ტაილის თაიმლაინზე გადათრევა (drag & drop) მხოლოდ Windows-ზე მუშაობს.
    Mac-ზე: მონიშნე ტექსტ ლეიერი, აირჩიე ანიმაცია და დააჭირე Apply.
  - სხვისი პლაგინები ცალკე უნდა იყოს დაყენებული Mac-ზეც:
    Liquid Glass-ს სჭირდება TFM Liquid Glass. Deep Glow 2-ს ზოგი ეფექტი იყენებს, თუ დაყენებულია.


თუ რამე არ იმუშავა
------------------
  - UXP Developer Tool-ის გზაზე: გადაუღე სქრინი "Ultimate Kit Installer" პანელს (წითელი ტექსტი წერს რა მოხდა).
  - Terminal-ის გზაზე: სქრინი Terminal-ის ფანჯარას და ეს ფაილიც:
      ~/Library/Logs/Ultimate Kit Installer.log
    (Finder -> Go -> Go to Folder... -> ჩაწერე ~/Library/Logs)
  - თუ After Effects-ში Window -> Extensions-ში Ultimate Kit არ ჩანს: Mac გადატვირთე და კიდევ ერთხელ შეამოწმე.
